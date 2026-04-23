import * as functions from 'firebase-functions';
import { join } from 'path';
import axios from 'axios';
import * as admin from 'firebase-admin';
import { createHmac } from 'crypto';
import type { Request, Response } from 'express';
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

export const createVerificationKyc = functions.https.onRequest(async (req, res) => {
  const DIDIT_API_KEY = "oXR_Rak5sToZvLeTw10KkWel83brksuotxQ_elQW5-o"; // mueve a config en producción
  const DIDIT_BASE = 'https://verification.didit.me/v2';
  const { bookingId, amount, currency } = req.body;
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, test'
  });
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  const diditWorkflowId = "cf379690-cabe-4e1e-bc00-0732dd530019";
  const diditBody: any = {
    workflow_id: diditWorkflowId,
    vendor_data: bookingId,
    metadata: {
      bookingId,
      amount,
      currency
    },
    callback:  "https://xploratravel.com.mx/reservar/realizar-pago/verificacion-tarjeta/" + bookingId,
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
  const diditSession = diditResp.data;
  res.status(200).json(diditSession);
  return;
});

// ---- FUNCIÓN PAYCLIP ----
const TOKEN = "Basic OTk2NDJiZTktOGMxNS00NjY3LWJiZGYtMTY2MTk5OTljMDlmOjMzMjY5OTZhLTU1N2YtNDZmYS1iM2FlLTE4NzgwNTVlZjJlZg==";
const TEST_TOKEN = "Basic dGVzdF9iYjljOTc4MS1lM2QzLTRlYTQtYTFkMS02MTg1NTBmNmE3YWQ6N2RiNGIzNTktNzlmZC00MWJmLWI1NTMtMTQ0YTQxNjBkZjgw";
const TEST_API_KEY = "test_bb9c9781-e3d3-4ea4-a1d1-618550f6a7ad";
const API_KEY = "99642be9-8c15-4667-bbdf-16619999c09f";



if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

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
const FLOW_SITE_URL = 'https://xploratravel.com.mx';
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
  const totalDue = Number(currentPayment.totalDue || statusData.amount || 0);
  const bookingStatus = typeof booking.status === 'string' ? booking.status : 'PENDING';
  const isAlreadySettled =
    Number(currentPayment.payed || 0) >= totalDue && totalDue > 0 ||
    currentPayment.status === 'VALIDATING' ||
    currentPayment.status === 'COMPLETED';

  let nextBookingStatus = bookingStatus;
  let nextPaymentStatus = currentPayment.status || 'PENDING';
  let nextPayedAmount = Number(currentPayment.payed || 0);

  switch (statusData.status) {
    case 2:
      nextBookingStatus = bookingStatus === 'CONFIRMED' ? 'CONFIRMED' : 'VALIDATING';
      nextPaymentStatus = bookingStatus === 'CONFIRMED' ? 'COMPLETED' : 'VALIDATING';
      nextPayedAmount = Math.max(nextPayedAmount, totalDue || Number(statusData.amount || 0));
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
    },
  });

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
