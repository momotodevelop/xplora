import * as functions from 'firebase-functions';
import { join } from 'path';
import axios from 'axios';
import * as admin from 'firebase-admin';
import { createHmac } from 'crypto';
import type { Request, Response } from 'express';
import { defineSecret } from 'firebase-functions/params';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import {
  applyDuffelPricing,
  DEFAULT_DUFFEL_STAYS_CONFIG,
  DEFAULT_FLIGHT_PRICING_CONFIG,
  DuffelEnvironment,
  DuffelSecretBundle,
  DuffelStaysConfig,
  FlightPricingConfig,
  inferDuffelEnvironment,
  normalizeDuffelToken,
  normalizeDuffelStaysConfig,
  normalizeFlightPricingConfig,
  parseDuffelSecretBundle,
  serializeDuffelSecretBundle,
  validateDuffelToken,
} from './duffel-config';
//import Stripe from 'stripe';
//import { DateTime } from 'luxon';
//import { onDocumentCreated } from "firebase-functions/v2/firestore";
/*import {
    ApiError,
    CheckoutPaymentIntent,
    Client,
    Environment,
    LogLevel,
    OrdersCardVerificationMethod,
    OrdersController
} from "@paypal/paypal-server-sdk";*/


const angularServerDistPath = join(__dirname, 'ssr-bundle');
const fullMjsPath = join(angularServerDistPath, 'server.mjs');

console.log('DEBUG: Intentando importar server.mjs desde:', fullMjsPath);

const serverAppPromise = import(fullMjsPath);

const XPLORA_SITE_URL = 'https://xploratravel.com.mx';
const DUFFEL_API_BASE = 'https://api.duffel.com';
const DUFFEL_ACCESS_TOKEN = defineSecret('DUFFEL_ACCESS_TOKEN');
const DUFFEL_CONFIG_DOC = 'config/flights';
const DUFFEL_STAYS_CONFIG_DOC = 'config/stays';
const secretManager = new SecretManagerServiceClient();
const DIDIT_API_KEY = "oXR_Rak5sToZvLeTw10KkWel83brksuotxQ_elQW5-o"; // TODO: mover a Secret Manager
const DIDIT_BASE = 'https://verification.didit.me/v2';
const DIDIT_WORKFLOW_ID = "cf379690-cabe-4e1e-bc00-0732dd530019";

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

interface DiditSessionResponse extends Record<string, unknown> {
  session_id?: string;
  status?: string;
  url?: string;
  session_url?: string;
  verification_url?: string;
}

interface StoredFlowKycSession {
  provider: 'DIDIT';
  url: string;
  sessionId?: string;
  status?: string;
  callbackUrl: string;
  createdAt?: FirebaseFirestore.Timestamp | Date;
}

interface CreatedDiditSession {
  raw: DiditSessionResponse;
  kyc: StoredFlowKycSession;
}

function buildDiditCallbackUrl(bookingId: string): string {
  return `${XPLORA_SITE_URL}/reservar/realizar-pago/${bookingId}?card=true`;
}

function resolveDiditSessionUrl(session: DiditSessionResponse): string | undefined {
  const candidates = [session.url, session.session_url, session.verification_url];
  return candidates.find((candidate) => typeof candidate === 'string' && candidate.trim())?.trim();
}

async function createDiditVerificationSession(
  bookingId: string,
  amount: number,
  currency: string,
  options?: {
    flowOrder?: number;
    commerceOrder?: string;
  }
): Promise<CreatedDiditSession> {
  const callbackUrl = buildDiditCallbackUrl(bookingId);
  const diditBody = {
    workflow_id: DIDIT_WORKFLOW_ID,
    vendor_data: bookingId,
    metadata: {
      bookingId,
      amount,
      currency,
      flowOrder: options?.flowOrder ?? null,
      commerceOrder: options?.commerceOrder ?? null,
    },
    callback: callbackUrl,
    language: 'es'
  };

  const diditResp = await axios.post(
    `${DIDIT_BASE}/session/`,
    diditBody,
    {
      headers: {
        'X-Api-Key': DIDIT_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    }
  );

  const raw = diditResp.data as DiditSessionResponse;
  const url = resolveDiditSessionUrl(raw);

  if (!url) {
    throw new Error('DIDIT_SESSION_URL_MISSING');
  }

  return {
    raw,
    kyc: {
      provider: 'DIDIT',
      url,
      sessionId: typeof raw.session_id === 'string' ? raw.session_id : undefined,
      status: typeof raw.status === 'string' ? raw.status : 'Not Started',
      callbackUrl,
      createdAt: new Date(),
    },
  };
}

export const ssrApp = functions.https.onRequest(async (request, response) => {
  try {
    const serverModule = await serverAppPromise;
    const app = serverModule.app();
    app(request, response);
  } catch (error) {
    console.error("Error al inicializar o ejecutar la aplicación SSR:", error);
    response.status(500).send("Error interno del servidor.");
  }
});

interface StoredFlightPricingConfig extends FlightPricingConfig {
  updatedAt?: FirebaseFirestore.Timestamp;
  updatedBy?: FirebaseFirestore.DocumentReference;
}

interface DuffelRuntimeContext {
  config: FlightPricingConfig;
  environment: DuffelEnvironment;
  token: string;
}

interface DuffelStaysRuntimeContext {
  config: DuffelStaysConfig;
  environment: DuffelEnvironment;
  token: string;
}

function getFirebaseProjectId(): string {
  const projectId =
    admin.app().options.projectId ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    '';
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID_MISSING');
  }
  return projectId;
}

function getDuffelSecretParent(): string {
  return `projects/${getFirebaseProjectId()}/secrets/DUFFEL_ACCESS_TOKEN`;
}

function getBoundDuffelSecret(): string {
  try {
    return normalizeDuffelToken(DUFFEL_ACCESS_TOKEN.value());
  } catch {
    return normalizeDuffelToken(
      process.env.DUFFEL_ACCESS_TOKEN || process.env.DUFFEL_TOKEN
    );
  }
}

async function readDuffelSecretBundle(): Promise<DuffelSecretBundle> {
  try {
    const [version] = await secretManager.accessSecretVersion({
      name: `${getDuffelSecretParent()}/versions/latest`,
    });
    return parseDuffelSecretBundle(version.payload?.data?.toString());
  } catch (error) {
    const fallback = getBoundDuffelSecret();
    if (fallback) {
      return parseDuffelSecretBundle(fallback);
    }
    throw error;
  }
}

async function writeDuffelSecretBundle(
  bundle: DuffelSecretBundle
): Promise<void> {
  await secretManager.addSecretVersion({
    parent: getDuffelSecretParent(),
    payload: {
      data: Buffer.from(serializeDuffelSecretBundle(bundle), 'utf8'),
    },
  });
}

function getDuffelTokenStatus(bundle: DuffelSecretBundle) {
  return {
    productionConfigured: Boolean(bundle.productionToken),
    testConfigured: Boolean(bundle.testToken),
  };
}

async function getDuffelRuntimeContext(): Promise<DuffelRuntimeContext> {
  const bundle = await readDuffelSecretBundle();
  const storedConfig = normalizeFlightPricingConfig(
    bundle.config || DEFAULT_FLIGHT_PRICING_CONFIG
  );
  const environment = inferDuffelEnvironment(
    Boolean(bundle.config),
    storedConfig,
    bundle
  );
  const token =
    environment === 'production'
      ? bundle.productionToken
      : bundle.testToken;
  if (!token) {
    throw new Error(
      environment === 'production'
        ? 'DUFFEL_LIVE_TOKEN_MISSING'
        : 'DUFFEL_TEST_TOKEN_MISSING'
    );
  }
  return {
    config: {
      ...storedConfig,
      environment,
    },
    environment,
    token,
  };
}

function getDuffelStaysTokenStatus(bundle: DuffelSecretBundle) {
  return {
    productionConfigured: Boolean(bundle.stays?.productionToken),
    testConfigured: Boolean(bundle.stays?.testToken),
  };
}

function getDuffelStaysConfig(bundle: DuffelSecretBundle): DuffelStaysConfig {
  const config = normalizeDuffelStaysConfig(
    bundle.stays?.config || DEFAULT_DUFFEL_STAYS_CONFIG
  );
  if (bundle.stays?.config) {
    return config;
  }
  if (bundle.stays?.testToken) {
    return {...config, environment: 'test'};
  }
  return bundle.stays?.productionToken ?
    {...config, environment: 'production'} :
    config;
}

async function getDuffelStaysRuntimeContext(
  requireEnabled = true
): Promise<DuffelStaysRuntimeContext> {
  const bundle = await readDuffelSecretBundle();
  const config = getDuffelStaysConfig(bundle);
  if (requireEnabled && !config.enabled) {
    throw Object.assign(new Error('DUFFEL_STAYS_DISABLED'), {
      statusCode: 503,
    });
  }
  const token = config.environment === 'production' ?
    bundle.stays?.productionToken :
    bundle.stays?.testToken;
  if (!token) {
    throw Object.assign(
      new Error(
        config.environment === 'production' ?
          'DUFFEL_STAYS_LIVE_TOKEN_MISSING' :
          'DUFFEL_STAYS_TEST_TOKEN_MISSING'
      ),
      {statusCode: 503}
    );
  }
  return {
    config,
    environment: config.environment,
    token,
  };
}

async function requireAdmin(req: Request): Promise<string> {
  const authorization = String(req.headers.authorization || '');
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  if (!match) {
    throw Object.assign(new Error('AUTH_REQUIRED'), {statusCode: 401});
  }
  const decoded = await admin.auth().verifyIdToken(match[1]);
  const role = String(decoded.role || '');
  if (
    decoded.admin !== true &&
    role !== 'admin' &&
    role !== 'superadmin'
  ) {
    throw Object.assign(new Error('ADMIN_REQUIRED'), {statusCode: 403});
  }
  return decoded.uid;
}

async function getDuffelAdminConfig(req: Request, res: Response) {
  await requireAdmin(req);
  const bundle = await readDuffelSecretBundle();
  const storedConfig = normalizeFlightPricingConfig(
    bundle.config || DEFAULT_FLIGHT_PRICING_CONFIG
  );
  const environment = inferDuffelEnvironment(
    Boolean(bundle.config),
    storedConfig,
    bundle
  );
  res.status(200).json({
    data: {
      ...storedConfig,
      environment,
      secrets: getDuffelTokenStatus(bundle),
    },
  });
}

async function saveDuffelAdminConfig(req: Request, res: Response) {
  const uid = await requireAdmin(req);
  const existingBundle = await readDuffelSecretBundle();
  const storedConfig = normalizeFlightPricingConfig(
    existingBundle.config || DEFAULT_FLIGHT_PRICING_CONFIG
  );
  const currentConfig: FlightPricingConfig = {
    ...storedConfig,
    environment: inferDuffelEnvironment(
      Boolean(existingBundle.config),
      storedConfig,
      existingBundle
    ),
  };
  const section = String(req.body?.section || 'all');
  if (!['connection', 'pricing', 'all'].includes(section)) {
    throw Object.assign(new Error('DUFFEL_CONFIG_SECTION_INVALID'), {
      statusCode: 400,
    });
  }

  const rawConfig = req.body?.config || {};
  let nextConfig: FlightPricingConfig;
  if (section === 'connection') {
    nextConfig = normalizeFlightPricingConfig({
      ...currentConfig,
      environment: rawConfig.environment,
    });
  } else if (section === 'pricing') {
    nextConfig = normalizeFlightPricingConfig({
      ...currentConfig,
      usdExchangeRate:
        rawConfig.usdExchangeRate ?? currentConfig.usdExchangeRate,
      modifiers: {
        ...currentConfig.modifiers,
        ...(rawConfig.modifiers || {}),
      },
    });
  } else {
    nextConfig = normalizeFlightPricingConfig(rawConfig);
  }

  const savesConnection = section === 'connection' || section === 'all';
  const productionToken = savesConnection ?
    normalizeDuffelToken(req.body?.productionToken) :
    '';
  const testToken = savesConnection ?
    normalizeDuffelToken(req.body?.testToken) :
    '';
  const nextBundle: DuffelSecretBundle = {...existingBundle, version: 1};

  if (productionToken) {
    validateDuffelToken(productionToken, 'production');
    nextBundle.productionToken = productionToken;
  }
  if (testToken) {
    validateDuffelToken(testToken, 'test');
    nextBundle.testToken = testToken;
  }
  nextBundle.config = nextConfig;
  if (
    savesConnection &&
    nextConfig.environment === 'production' &&
    !nextBundle.productionToken
  ) {
    throw Object.assign(new Error('DUFFEL_LIVE_TOKEN_MISSING'), {
      statusCode: 400,
    });
  }
  if (
    savesConnection &&
    nextConfig.environment === 'test' &&
    !nextBundle.testToken
  ) {
    throw Object.assign(new Error('DUFFEL_TEST_TOKEN_MISSING'), {
      statusCode: 400,
    });
  }

  await writeDuffelSecretBundle(nextBundle);

  const payload: StoredFlightPricingConfig = {
    ...nextConfig,
    updatedAt: admin.firestore.Timestamp.now(),
    updatedBy: db.doc(`users/${uid}`),
  };
  await db.doc(DUFFEL_CONFIG_DOC).set(payload, {merge: true});
  res.status(200).json({
    data: {
      ...nextConfig,
      secrets: getDuffelTokenStatus(nextBundle),
    },
  });
}

async function verifyDuffelAdminConnection(req: Request, res: Response) {
  await requireAdmin(req);
  const runtime = await getDuffelRuntimeContext();
  await axios.get(
    `${DUFFEL_API_BASE}/places/suggestions`,
    {
      headers: {
        Authorization: `Bearer ${runtime.token}`,
        'Duffel-Version': 'v2',
        Accept: 'application/json',
      },
      params: {query: 'MEX'},
      timeout: 15000,
    }
  );
  res.status(200).json({
    data: {
      connected: true,
      environment: runtime.environment,
      checkedAt: new Date().toISOString(),
    },
  });
}

async function getDuffelStaysAdminConfig(req: Request, res: Response) {
  await requireAdmin(req);
  const bundle = await readDuffelSecretBundle();
  res.status(200).json({
    data: {
      ...getDuffelStaysConfig(bundle),
      secrets: getDuffelStaysTokenStatus(bundle),
    },
  });
}

async function saveDuffelStaysAdminConfig(req: Request, res: Response) {
  const uid = await requireAdmin(req);
  const existingBundle = await readDuffelSecretBundle();
  const existingStays = existingBundle.stays || {};
  const nextConfig = normalizeDuffelStaysConfig(req.body?.config);
  const productionToken = normalizeDuffelToken(req.body?.productionToken);
  const testToken = normalizeDuffelToken(req.body?.testToken);
  const nextStays = {...existingStays};

  if (productionToken) {
    validateDuffelToken(productionToken, 'production');
    nextStays.productionToken = productionToken;
  }
  if (testToken) {
    validateDuffelToken(testToken, 'test');
    nextStays.testToken = testToken;
  }
  nextStays.config = nextConfig;

  if (
    nextConfig.enabled &&
    nextConfig.environment === 'production' &&
    !nextStays.productionToken
  ) {
    throw Object.assign(new Error('DUFFEL_STAYS_LIVE_TOKEN_MISSING'), {
      statusCode: 400,
    });
  }
  if (
    nextConfig.enabled &&
    nextConfig.environment === 'test' &&
    !nextStays.testToken
  ) {
    throw Object.assign(new Error('DUFFEL_STAYS_TEST_TOKEN_MISSING'), {
      statusCode: 400,
    });
  }

  const nextBundle: DuffelSecretBundle = {
    ...existingBundle,
    version: 1,
    stays: nextStays,
  };
  await writeDuffelSecretBundle(nextBundle);
  await db.doc(DUFFEL_STAYS_CONFIG_DOC).set({
    ...nextConfig,
    updatedAt: admin.firestore.Timestamp.now(),
    updatedBy: db.doc(`users/${uid}`),
  }, {merge: true});

  res.status(200).json({
    data: {
      ...nextConfig,
      secrets: getDuffelStaysTokenStatus(nextBundle),
    },
  });
}

async function verifyDuffelStaysAdminConnection(
  req: Request,
  res: Response
) {
  await requireAdmin(req);
  const runtime = await getDuffelStaysRuntimeContext(false);
  await axios.get(
    `${DUFFEL_API_BASE}/stays/accommodation`,
    {
      headers: {
        Authorization: `Bearer ${runtime.token}`,
        'Duffel-Version': 'v2',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip',
      },
      params: {
        latitude: 51.5071,
        longitude: -0.1416,
        radius: 1,
        limit: 1,
      },
      timeout: 20000,
    }
  );
  res.status(200).json({
    data: {
      connected: true,
      environment: runtime.environment,
      checkedAt: new Date().toISOString(),
    },
  });
}

async function getDuffelStaysPublicConfig(res: Response) {
  const bundle = await readDuffelSecretBundle();
  const config = getDuffelStaysConfig(bundle);
  res.status(200).json({
    data: {
      enabled: config.enabled,
    },
  });
}

async function suggestDuffelStaysDestinations(
  req: Request,
  res: Response
) {
  const runtime = await getDuffelStaysRuntimeContext();
  const query = String(req.body?.query || '').trim();
  if (query.length < 3 || query.length > 100) {
    throw Object.assign(
      new Error('DUFFEL_STAYS_DESTINATION_QUERY_INVALID'),
      {statusCode: 400}
    );
  }

  const headers = {
    Authorization: `Bearer ${runtime.token}`,
    'Duffel-Version': 'v2',
    Accept: 'application/json',
    'Accept-Encoding': 'gzip',
  };
  const [placesResult, accommodationsResult] = await Promise.allSettled([
    axios.get(
      `${DUFFEL_API_BASE}/places/suggestions`,
      {
        headers,
        params: {query},
        timeout: 15000,
      }
    ),
    axios.post(
      `${DUFFEL_API_BASE}/stays/accommodation/suggestions`,
      {data: {query}},
      {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    ),
  ]);

  if (
    placesResult.status === 'rejected' &&
    accommodationsResult.status === 'rejected'
  ) {
    throw accommodationsResult.reason || placesResult.reason;
  }

  const suggestions: Array<{
    id: string;
    type: 'city' | 'airport' | 'accommodation';
    name: string;
    secondaryName: string;
    latitude: number;
    longitude: number;
  }> = [];
  const seen = new Set<string>();
  const addSuggestion = (
    suggestion: {
      id: string;
      type: 'city' | 'airport' | 'accommodation';
      name: string;
      secondaryName: string;
      latitude: number;
      longitude: number;
    }
  ) => {
    if (
      !suggestion.id ||
      !suggestion.name ||
      !Number.isFinite(suggestion.latitude) ||
      !Number.isFinite(suggestion.longitude)
    ) {
      return;
    }
    const key = `${suggestion.type}:${suggestion.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      suggestions.push(suggestion);
    }
  };

  if (placesResult.status === 'fulfilled') {
    const places = Array.isArray(placesResult.value.data?.data) ?
      placesResult.value.data.data :
      [];
    for (const place of places) {
      if (place?.type !== 'city' && place?.type !== 'airport') {
        continue;
      }
      const type = place.type as 'city' | 'airport';
      const cityName = String(place.city_name || '').trim();
      const name = String(
        type === 'city' ? (cityName || place.name) : place.name
      ).trim();
      const secondaryParts = [
        type === 'airport' && cityName !== name ? cityName : '',
        String(place.iata_country_code || '').trim(),
        String(place.iata_code || '').trim(),
      ].filter(Boolean);
      addSuggestion({
        id: String(place.id || place.iata_code || '').trim(),
        type,
        name,
        secondaryName: secondaryParts.join(' · '),
        latitude: Number(place.latitude),
        longitude: Number(place.longitude),
      });
    }
  }

  if (accommodationsResult.status === 'fulfilled') {
    const accommodationSuggestions = Array.isArray(
      accommodationsResult.value.data?.data
    ) ? accommodationsResult.value.data.data : [];
    for (const accommodation of accommodationSuggestions) {
      const location = accommodation?.accommodation_location || {};
      const coordinates = location.geographic_coordinates || {};
      const address = location.address || {};
      addSuggestion({
        id: String(accommodation?.accommodation_id || '').trim(),
        type: 'accommodation',
        name: String(accommodation?.accommodation_name || '').trim(),
        secondaryName: [
          String(address.line_one || '').trim(),
          String(address.city_name || '').trim(),
          String(address.region || '').trim(),
          String(address.country_code || '').trim(),
        ].filter(Boolean).join(', '),
        latitude: Number(coordinates.latitude),
        longitude: Number(coordinates.longitude),
      });
    }
  }

  const priority = {
    city: 0,
    airport: 1,
    accommodation: 2,
  };
  suggestions.sort((left, right) => priority[left.type] - priority[right.type]);
  res.status(200).json({data: suggestions.slice(0, 15)});
}

function requireFiniteNumber(
  value: unknown,
  field: string,
  min: number,
  max: number
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw Object.assign(new Error(`DUFFEL_STAYS_${field}_INVALID`), {
      statusCode: 400,
    });
  }
  return parsed;
}

function requireIsoDate(value: unknown, field: string): string {
  const date = String(value || '').trim();
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(`${date}T00:00:00Z`))
  ) {
    throw Object.assign(new Error(`DUFFEL_STAYS_${field}_INVALID`), {
      statusCode: 400,
    });
  }
  return date;
}

async function searchDuffelStays(req: Request, res: Response) {
  const runtime = await getDuffelStaysRuntimeContext();
  const latitude = requireFiniteNumber(
    req.body?.latitude,
    'LATITUDE',
    -90,
    90
  );
  const longitude = requireFiniteNumber(
    req.body?.longitude,
    'LONGITUDE',
    -180,
    180
  );
  const radius = requireFiniteNumber(
    req.body?.radius ?? 10,
    'RADIUS',
    1,
    100
  );
  const rooms = requireFiniteNumber(req.body?.rooms, 'ROOMS', 1, 100);
  const adults = requireFiniteNumber(req.body?.adults, 'ADULTS', 1, 400);
  if (!Number.isInteger(rooms) || !Number.isInteger(adults) || adults < rooms) {
    throw Object.assign(new Error('DUFFEL_STAYS_OCCUPANCY_INVALID'), {
      statusCode: 400,
    });
  }
  const rawChildrenAges = Array.isArray(req.body?.childrenAges) ?
    req.body.childrenAges :
    [];
  const childrenAges = rawChildrenAges.map((age: unknown) => {
    const parsedAge = requireFiniteNumber(age, 'CHILD_AGE', 0, 17);
    if (!Number.isInteger(parsedAge)) {
      throw Object.assign(new Error('DUFFEL_STAYS_CHILD_AGE_INVALID'), {
        statusCode: 400,
      });
    }
    return parsedAge;
  });
  const checkInDate = requireIsoDate(req.body?.checkInDate, 'CHECK_IN');
  const checkOutDate = requireIsoDate(req.body?.checkOutDate, 'CHECK_OUT');

  const response = await axios.post(
    `${DUFFEL_API_BASE}/stays/search`,
    {
      data: {
        rooms,
        location: {
          radius,
          geographic_coordinates: {
            latitude,
            longitude,
          },
        },
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        guests: [
          ...Array.from({length: adults}, () => ({type: 'adult'})),
          ...childrenAges.map((age: number) => ({type: 'child', age})),
        ],
        mobile: req.body?.mobile === true,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${runtime.token}`,
        'Duffel-Version': 'v2',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip',
        'Content-Type': 'application/json',
      },
      timeout: 55000,
    }
  );
  res.status(200).json(response.data);
}

function setDuffelCors(res: Response): void {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
}

/**
 * Server-side gateway for Duffel. The access token must never be sent to the
 * Angular application. Supported resources:
 *   GET  ?resource=places&query=...
 *   GET  ?resource=places&lat=...&lng=...&rad=...
 *   GET  ?resource=seat_maps&offer_id=...
 *   GET  ?resource=offer&offer_id=...&return_available_services=true
 *   POST ?resource=offers
 */
export const duffelApi = functions.https.onRequest(
  {
    secrets: [DUFFEL_ACCESS_TOKEN],
    timeoutSeconds: 60,
    memory: '512MiB',
  },
  async (req: Request, res: Response) => {
    setDuffelCors(res);
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    try {
      const resource = String(req.query.resource || '').trim();
      if (resource === 'admin_config' && req.method === 'GET') {
        await getDuffelAdminConfig(req, res);
        return;
      }
      if (resource === 'admin_config' && req.method === 'POST') {
        await saveDuffelAdminConfig(req, res);
        return;
      }
      if (resource === 'admin_connection' && req.method === 'GET') {
        await verifyDuffelAdminConnection(req, res);
        return;
      }
      if (resource === 'stays_admin_config' && req.method === 'GET') {
        await getDuffelStaysAdminConfig(req, res);
        return;
      }
      if (resource === 'stays_admin_config' && req.method === 'POST') {
        await saveDuffelStaysAdminConfig(req, res);
        return;
      }
      if (resource === 'stays_admin_connection' && req.method === 'GET') {
        await verifyDuffelStaysAdminConnection(req, res);
        return;
      }
      if (resource === 'stays_config' && req.method === 'GET') {
        await getDuffelStaysPublicConfig(res);
        return;
      }
      if (resource === 'stays_destinations' && req.method === 'POST') {
        await suggestDuffelStaysDestinations(req, res);
        return;
      }
      if (resource === 'stays_search' && req.method === 'POST') {
        await searchDuffelStays(req, res);
        return;
      }
      if (req.method === 'GET' && resource === 'health') {
        res.status(200).json({
          ok: true,
        });
        return;
      }

      const runtime = await getDuffelRuntimeContext();
      const headers = {
        Authorization: `Bearer ${runtime.token}`,
        'Duffel-Version': 'v2',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip',
      };
      if (req.method === 'GET' && resource === 'places') {
        const params: Record<string, string> = {};
        for (const key of ['query', 'lat', 'lng', 'rad']) {
          const value = req.query[key];
          if (typeof value === 'string' && value.trim()) {
            params[key] = value.trim();
          }
        }
        const response = await axios.get(
          `${DUFFEL_API_BASE}/places/suggestions`,
          {headers, params, timeout: 15000}
        );
        res.status(200).json(response.data);
        return;
      }

      if (req.method === 'GET' && resource === 'seat_maps') {
        const offerId = String(req.query.offer_id || '').trim();
        if (!offerId) {
          res.status(400).json({message: 'offer_id es requerido.'});
          return;
        }
        const response = await axios.get(
          `${DUFFEL_API_BASE}/air/seat_maps`,
          {headers, params: {offer_id: offerId}, timeout: 20000}
        );
        res.status(200).json(
          applyDuffelPricing(response.data, resource, runtime.config)
        );
        return;
      }

      if (req.method === 'GET' && resource === 'offer') {
        const offerId = String(req.query.offer_id || '').trim();
        if (!offerId) {
          res.status(400).json({message: 'offer_id es requerido.'});
          return;
        }
        const returnAvailableServices = String(req.query.return_available_services || '').trim() === 'true';
        const response = await axios.get(
          `${DUFFEL_API_BASE}/air/offers/${encodeURIComponent(offerId)}`,
          {
            headers,
            params: returnAvailableServices ? {return_available_services: true} : undefined,
            timeout: 20000,
          }
        );
        res.status(200).json(
          applyDuffelPricing(response.data, resource, runtime.config)
        );
        return;
      }

      if (req.method === 'POST' && resource === 'offers') {
        const response = await axios.post(
          `${DUFFEL_API_BASE}/air/offer_requests`,
          req.body,
          {
            headers: {...headers, 'Content-Type': 'application/json'},
            params: {
              return_offers: true,
              supplier_timeout: 45000,
            },
            timeout: 55000,
          }
        );
        res.status(200).json(
          applyDuffelPricing(response.data, resource, runtime.config)
        );
        return;
      }

      res.status(404).json({message: 'Recurso de Duffel no soportado.'});
    } catch (error: any) {
      const status =
        Number(error.statusCode) || Number(error.response?.status) || 502;
      console.error('Duffel API error:', {
        error: error.response?.data || error.message,
      });
      res.status(status).json({
        message: 'No fue posible consultar Duffel.',
        error: error.response?.data || error.message,
      });
    }
  }
);

export const createVerificationKyc = functions.https.onRequest(async (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, test'
  });
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Método no permitido' });
    return;
  }

  try {
    const bookingId = String(req.body?.bookingId || '').trim();
    const amount = Number(req.body?.amount || 0);
    const currency = String(req.body?.currency || 'MXN').trim() || 'MXN';

    if (!bookingId) {
      res.status(400).json({ message: 'El parámetro bookingId es requerido.' });
      return;
    }

    const session = await createDiditVerificationSession(bookingId, amount, currency);
    res.status(200).json(session.raw);
  } catch (error: any) {
    console.error('Error al crear la sesión KYC:', error.response?.data || error);
    res.status(500).json({
      message: 'No fue posible crear la validación de identidad.',
      error: error.response?.data || error.message || error,
    });
  }
});

// ---- FUNCIÓN PAYCLIP ----
const TOKEN = "Basic OTk2NDJiZTktOGMxNS00NjY3LWJiZGYtMTY2MTk5OTljMDlmOjMzMjY5OTZhLTU1N2YtNDZmYS1iM2FlLTE4NzgwNTVlZjJlZg==";
const TEST_TOKEN = "Basic dGVzdF9iYjljOTc4MS1lM2QzLTRlYTQtYTFkMS02MTg1NTBmNmE3YWQ6N2RiNGIzNTktNzlmZC00MWJmLWI1NTMtMTQ0YTQxNjBkZjgw";
const TEST_API_KEY = "test_bb9c9781-e3d3-4ea4-a1d1-618550f6a7ad";
const API_KEY = "99642be9-8c15-4667-bbdf-16619999c09f";



type FlowOrderStatus = 1 | 2 | 3 | 4;

interface FlowConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  paymentMethod: number;
  currency: string;
  paymentCurrency: string;
  siteUrl: string;
  confirmationUrl: string;
}

interface FlowCreateResponse {
  url: string;
  token: string;
  flowOrder: number;
}

interface StoredFlowCheckout {
  checkoutUrl: string;
  token: string;
  flowOrder: number;
  commerceOrder: string;
  amount: number;
  subject: string;
  kyc?: StoredFlowKycSession;
  createdAt?: FirebaseFirestore.Timestamp | Date;
}

interface FlowPaymentStatusResponse {
  flowOrder: number;
  commerceOrder: string;
  requestDate: string;
  status: FlowOrderStatus;
  subject: string;
  currency: string;
  amount: number;
  payer: string;
  optional?: Record<string, unknown> | string | null;
  paymentData?: Record<string, unknown> | null;
  pending_info?: Record<string, unknown> | null;
  merchantId?: string;
}

const FLOW_COMMERCE_ORDER_DELIMITER = '_';
// TODO: mover estas credenciales a Secret Manager.
const FLOW_API_KEY = '56B58F34-648A-49A9-8542-3C7L661AB360';
const FLOW_SECRET_KEY = '7da919407d8b8f768fb70c83dbdeb444dc286cd5';
const FLOW_BASE_URL = 'https://www.flow.cl/api';
const FLOW_PAYMENT_METHOD = 11;
const FLOW_CURRENCY = 'MXN';
const FLOW_PAYMENT_CURRENCY = 'MXN';
const FLOW_SITE_URL = XPLORA_SITE_URL;
const FLOW_CONFIRMATION_URL = 'https://flowpaymentconfirmation-qoi5yrbrfa-uc.a.run.app';

function getFlowConfig(): FlowConfig {
  if (!FLOW_API_KEY || !FLOW_SECRET_KEY) {
    throw new Error('FLOW_CONFIG_MISSING');
  }

  return {
    apiKey: FLOW_API_KEY,
    secretKey: FLOW_SECRET_KEY,
    baseUrl: FLOW_BASE_URL,
    paymentMethod: FLOW_PAYMENT_METHOD,
    currency: FLOW_CURRENCY,
    paymentCurrency: FLOW_PAYMENT_CURRENCY,
    siteUrl: FLOW_SITE_URL,
    confirmationUrl: FLOW_CONFIRMATION_URL,
  };
}

function signFlowParams(params: Record<string, string | number>): string {
  const { secretKey } = getFlowConfig();
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}${params[key]}`)
    .join('');

  return createHmac('sha256', secretKey).update(toSign).digest('hex');
}

function buildFlowFormBody(params: Record<string, string | number>): string {
  const form = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    form.set(key, String(value));
  });
  return form.toString();
}

function buildFlowCommerceOrder(bookingId: string): string {
  return `${Date.now().toString(36)}${FLOW_COMMERCE_ORDER_DELIMITER}${getBookingShortReference(bookingId)}`;
}

function getBookingShortReference(bookingId: string): string {
  return String(bookingId).slice(-6).toUpperCase();
}

function parseFlowOptional(optionalValue: FlowPaymentStatusResponse['optional']): Record<string, unknown> | undefined {
  if (!optionalValue) {
    return undefined;
  }

  if (typeof optionalValue === 'object') {
    return optionalValue as Record<string, unknown>;
  }

  if (typeof optionalValue === 'string') {
    try {
      return JSON.parse(optionalValue) as Record<string, unknown>;
    } catch (error) {
      console.warn('No se pudo parsear el campo optional de Flow:', error);
    }
  }

  return undefined;
}

function extractBookingIdFromCommerceOrder(commerceOrder: string): string | undefined {
  return undefined;
}

function extractBookingIdFromFlowStatus(statusData: FlowPaymentStatusResponse): string | undefined {
  const optionalData = parseFlowOptional(statusData.optional);
  const bookingIdFromOptional = optionalData?.['bookingId'] || optionalData?.['bookingID'];
  if (typeof bookingIdFromOptional === 'string' && bookingIdFromOptional.trim()) {
    return bookingIdFromOptional.trim();
  }

  return extractBookingIdFromCommerceOrder(statusData.commerceOrder);
}

function extractFlowToken(req: Request & { rawBody?: Buffer }): string | undefined {
  if (typeof req.body?.token === 'string' && req.body.token.trim()) {
    return req.body.token.trim();
  }

  if (typeof req.body === 'string') {
    const parsedBody = new URLSearchParams(req.body);
    const token = parsedBody.get('token');
    if (token) {
      return token;
    }
  }

  const rawBody = req.rawBody?.toString('utf8');
  if (rawBody) {
    const parsedRawBody = new URLSearchParams(rawBody);
    const token = parsedRawBody.get('token');
    if (token) {
      return token;
    }
  }

  if (typeof req.query.token === 'string' && req.query.token.trim()) {
    return req.query.token.trim();
  }

  return undefined;
}

async function fetchFlowPaymentStatus(token: string): Promise<FlowPaymentStatusResponse> {
  const flowConfig = getFlowConfig();
  const params = {
    apiKey: flowConfig.apiKey,
    token,
  };

  const response = await axios.get<FlowPaymentStatusResponse>(`${flowConfig.baseUrl}/payment/getStatus`, {
    params: {
      ...params,
      s: signFlowParams(params),
    },
  });

  return response.data;
}

async function addFlowGatewayRecord(
  bookingId: string,
  payload: Record<string, unknown>
): Promise<void> {
  await db.collection('bookings').doc(bookingId).collection('gateway_payments').add({
    processor: 'FLOW',
    processed_at: new Date(),
    response_data: payload,
  });
}

async function syncBookingFromFlowStatus(
  statusData: FlowPaymentStatusResponse,
  source: 'confirmation'
): Promise<string> {
  const bookingId = extractBookingIdFromFlowStatus(statusData);
  if (!bookingId) {
    throw new Error('FLOW_BOOKING_NOT_RESOLVED');
  }

  const bookingRef = db.collection('bookings').doc(bookingId);
  const bookingSnapshot = await bookingRef.get();
  if (!bookingSnapshot.exists) {
    throw new Error('FLOW_BOOKING_NOT_FOUND');
  }

  const booking = bookingSnapshot.data() || {};
  const currentPayment = booking.payment || {};
  const currentFlowCheckout = currentPayment.flowCheckout as StoredFlowCheckout | undefined;
  const totalDue = Number(currentPayment.totalDue || statusData.amount || 0);
  const bookingStatus = typeof booking.status === 'string' ? booking.status : 'PENDING';
  const isAlreadySettled =
    Number(currentPayment.payed || 0) >= totalDue && totalDue > 0 ||
    currentPayment.status === 'VALIDATING' ||
    currentPayment.status === 'COMPLETED';

  let nextBookingStatus = bookingStatus;
  let nextPaymentStatus = currentPayment.status || 'PENDING';
  let nextPayedAmount = Number(currentPayment.payed || 0);
  let nextFlowCheckout = currentFlowCheckout;
  let createdKycSession: CreatedDiditSession | undefined;

  switch (statusData.status) {
    case 2:
      nextBookingStatus = bookingStatus === 'CONFIRMED' ? 'CONFIRMED' : 'VALIDATING';
      nextPaymentStatus = 'VALIDATING';
      nextPayedAmount = Math.max(nextPayedAmount, totalDue || Number(statusData.amount || 0));

      if (!currentFlowCheckout?.kyc?.url) {
        const flowCheckoutBase: StoredFlowCheckout = {
          checkoutUrl: currentFlowCheckout?.checkoutUrl || '',
          token: currentFlowCheckout?.token || '',
          flowOrder: Number(currentFlowCheckout?.flowOrder || statusData.flowOrder || 0),
          commerceOrder: currentFlowCheckout?.commerceOrder || statusData.commerceOrder,
          amount: Number(currentFlowCheckout?.amount || statusData.amount || totalDue || 0),
          subject: currentFlowCheckout?.subject || statusData.subject || getBookingShortReference(bookingId),
          createdAt: currentFlowCheckout?.createdAt || new Date(),
        };

        createdKycSession = await createDiditVerificationSession(
          bookingId,
          Number(flowCheckoutBase.amount || totalDue || statusData.amount || 0),
          statusData.currency || getFlowConfig().currency,
          {
            flowOrder: flowCheckoutBase.flowOrder,
            commerceOrder: flowCheckoutBase.commerceOrder,
          }
        );

        nextFlowCheckout = {
          ...flowCheckoutBase,
          kyc: createdKycSession.kyc,
        };
      }
      break;
    case 3:
      nextPaymentStatus = 'FAILED';
      break;
    case 4:
      nextPaymentStatus = 'CANCELED';
      break;
    case 1:
    default:
      nextPaymentStatus = isAlreadySettled
        ? currentPayment.status || 'COMPLETED'
        : nextPayedAmount >= totalDue && totalDue > 0 ? 'COMPLETED' : 'PENDING';
      break;
  }

  await bookingRef.update({
    status: nextBookingStatus,
    payment: {
      ...currentPayment,
      payed: nextPayedAmount,
      status: nextPaymentStatus,
      ...(nextFlowCheckout ? { flowCheckout: nextFlowCheckout } : {}),
    },
  });

  if (createdKycSession) {
    await addFlowGatewayRecord(bookingId, {
      event: 'FLOW_KYC_CREATED',
      source,
      flowOrder: statusData.flowOrder,
      commerceOrder: statusData.commerceOrder,
      amount: statusData.amount,
      currency: statusData.currency,
      kycUrl: createdKycSession.kyc.url,
      kycStatus: createdKycSession.kyc.status ?? null,
      kycSessionId: createdKycSession.kyc.sessionId ?? null,
      callbackUrl: createdKycSession.kyc.callbackUrl,
      provider: createdKycSession.kyc.provider,
      didit: createdKycSession.raw,
    });
  }

  await addFlowGatewayRecord(bookingId, {
    event: 'FLOW_STATUS_SYNC',
    source,
    flowOrder: statusData.flowOrder,
    commerceOrder: statusData.commerceOrder,
    status: statusData.status,
    amount: statusData.amount,
    currency: statusData.currency,
    payer: statusData.payer,
    paymentData: statusData.paymentData ?? null,
    pending_info: statusData.pending_info ?? null,
    optional: statusData.optional ?? null,
    merchantId: statusData.merchantId ?? null,
    kycUrl: nextFlowCheckout?.kyc?.url ?? null,
    kycStatus: nextFlowCheckout?.kyc?.status ?? null,
  });
  return bookingId;
}

function buildFlowReturnUrl(siteUrl: string, bookingId: string): string {
  return `${siteUrl}/reservar/realizar-pago/${bookingId}?card=true`;
}

export const createClipPayment = functions.https.onRequest(async (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Test'
  });

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Método no permitido' });
    return;
  }

  const testPayment = req.headers['test'] === 'true';
  const authorizationToken = testPayment ? TEST_TOKEN : TOKEN;
  const clientIp = ((req.headers['x-forwarded-for'] || req.socket.remoteAddress || '') as string).split(',')[0].trim().match(/\d+\.\d+\.\d+\.\d+/)?.[0] || '0.0.0.0';
  console.log('IP del cliente 2:', clientIp);
  try {
    const paymentRequest = await axios.post(
      'https://api.payclip.com/payments',
      {
        ...req.body,
        location: {
          ip: clientIp
        }
      },
      {
        headers: {
          'Authorization': authorizationToken,
          'Content-Type': 'application/json'
        }
      }
    );
    const paymentsCollection = db.collection('bookings').doc(req.body.external_reference).collection('gateway_payments');
    const savedDB = await paymentsCollection.add({
      processor: 'CLIP',
      processed_at: new Date(),
      response_data: paymentRequest.data
    });

    res.status(200).json({response: paymentRequest.data, id: savedDB.id});

  } catch (error: any) {
    console.error('Error en PayClip:', error.response?.data || error);

    res.status(500).json({
      error: error.response?.data || 'Error al procesar el pago'
    });
  }
});

export const createFlowPayment = functions.https.onRequest(async (req: Request, res: Response) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Método no permitido' });
    return;
  }

  try {
    const flowConfig = getFlowConfig();
    const bookingId = String(req.body?.bookingId || '').trim();
    if (!bookingId) {
      res.status(400).json({ message: 'El parámetro bookingId es requerido.' });
      return;
    }

    const bookingRef = db.collection('bookings').doc(bookingId);
    const bookingSnapshot = await bookingRef.get();
    if (!bookingSnapshot.exists) {
      res.status(404).json({ message: 'La reservación no existe.' });
      return;
    }

    const booking = bookingSnapshot.data() || {};
    const totalDue = Number(booking?.payment?.totalDue || booking?.payment?.amount || 0);
    const amountPaid = Number(booking?.payment?.payed || 0);
    const amount = Math.max(totalDue - amountPaid, 0);
    const email = String(booking?.contact?.email || '').trim();
    const paymentStatus = String(booking?.payment?.status || '');
    const existingCheckout = booking?.payment?.flowCheckout as StoredFlowCheckout | undefined;

    if (!amount || amount <= 0) {
      res.status(400).json({ message: 'La reservación no tiene un monto válido para cobrar.' });
      return;
    }

    if (!email) {
      res.status(400).json({ message: 'La reservación no tiene correo de contacto para crear la orden.' });
      return;
    }

    if (
      amountPaid >= totalDue ||
      paymentStatus === 'VALIDATING' ||
      paymentStatus === 'COMPLETED' ||
      booking?.status === 'VALIDATING' ||
      booking?.status === 'CONFIRMED'
    ) {
      res.status(409).json({ message: 'La reservación ya no requiere un nuevo checkout de Flow.' });
      return;
    }

    if (booking?.status === 'CANCELED' || booking?.status === 'REJECTED') {
      res.status(409).json({ message: 'La reservación ya no está activa para procesar un pago.' });
      return;
    }

    if (existingCheckout?.checkoutUrl && Number(existingCheckout.amount) === amount) {
      res.status(200).json({
        checkoutUrl: existingCheckout.checkoutUrl,
        token: existingCheckout.token,
        flowOrder: existingCheckout.flowOrder,
      });
      return;
    }

    const commerceOrder = buildFlowCommerceOrder(bookingId);
    const subject = getBookingShortReference(bookingId);
    const optionalPayload = JSON.stringify({
      bookingId,
      shortReference: getBookingShortReference(bookingId),
      type: booking?.type || 'BOOKING',
    });

    const flowParams: Record<string, string | number> = {
      apiKey: flowConfig.apiKey,
      commerceOrder,
      subject,
      currency: flowConfig.currency,
      amount,
      email,
      paymentMethod: flowConfig.paymentMethod,
      urlConfirmation: flowConfig.confirmationUrl,
      urlReturn: buildFlowReturnUrl(flowConfig.siteUrl, bookingId),
      optional: optionalPayload,
      payment_currency: flowConfig.paymentCurrency,
    };

    const signature = signFlowParams(flowParams);
    const response = await axios.post<FlowCreateResponse>(
      `${flowConfig.baseUrl}/payment/create`,
      buildFlowFormBody({
        ...flowParams,
        s: signature,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const checkoutUrl = `${response.data.url}?token=${response.data.token}`;
    const storedCheckout: StoredFlowCheckout = {
      checkoutUrl,
      token: response.data.token,
      flowOrder: response.data.flowOrder,
      commerceOrder,
      amount,
      subject,
      createdAt: new Date(),
    };

    await bookingRef.update({
      payment: {
        ...(booking.payment || {}),
        flowCheckout: storedCheckout,
      },
    });

    await addFlowGatewayRecord(bookingId, {
      event: 'FLOW_ORDER_CREATED',
      flowOrder: response.data.flowOrder,
      commerceOrder,
      token: response.data.token,
      url: response.data.url,
      checkoutUrl,
      amount,
      currency: flowConfig.currency,
      paymentMethod: flowConfig.paymentMethod,
      subject,
    });

    res.status(200).json({
      checkoutUrl,
      token: response.data.token,
      flowOrder: response.data.flowOrder,
    });
  } catch (error: any) {
    console.error('Error al crear la orden en Flow:', error.response?.data || error);

    if (error instanceof Error && error.message === 'FLOW_CONFIG_MISSING') {
      res.status(500).json({
        message: 'Flow no está configurado. Define FLOW_API_KEY y FLOW_SECRET_KEY en functions/src/index.ts antes de usar esta integración.',
      });
      return;
    }

    res.status(500).json({
      message: 'No fue posible crear la orden de pago en Flow.',
      error: error.response?.data || error.message || error,
    });
  }
});

export const flowPaymentConfirmation = functions.https.onRequest(async (
  req: Request & { rawBody?: Buffer },
  res: Response
) => {
  if (req.method !== 'POST') {
    res.status(405).send('Método no permitido');
    return;
  }

  try {
    const token = extractFlowToken(req);
    if (!token) {
      res.status(400).send('token requerido');
      return;
    }

    const statusData = await fetchFlowPaymentStatus(token);
    await syncBookingFromFlowStatus(statusData, 'confirmation');
    res.status(200).send('OK');
  } catch (error: any) {
    console.error('Error al procesar la confirmación de Flow:', error.response?.data || error);
    res.status(500).send('Error');
  }
});

export const getClipPaymentDetails = functions.https.onRequest(async (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Test'
  });
  const testPayment = req.headers['test'] === 'true';

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Método no permitido' });
    return;
  }

  const paymentId = req.query.id as string;
  const bearerToken = 'Bearer '+(testPayment?TEST_API_KEY:API_KEY);

  console.log('Token de autorización:', bearerToken);

  if (!paymentId || !bearerToken) {
    res.status(400).json({ message: 'Faltan parámetros: id y/o Authorization' });
    return;
  }

  try {
    const response = await axios.get(`https://api.payclip.com/payments/${paymentId}`, {
      headers: {
        'Authorization': bearerToken
      }
    });
    res.status(200).json(response.data);

  } catch (error: any) {
    console.error('Error en payclipGetPayment:', error.response?.data || error);
    res.status(500).json({
      error: error.response?.data || 'Error al obtener el pago'
    });
  }
});
