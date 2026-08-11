/* eslint-disable require-jsdoc */

export type DuffelEnvironment = "test" | "production";

export interface FlightPricingConfig {
  environment: DuffelEnvironment;
  usdExchangeRate: number;
  modifiers: {
    flightsPercent: number;
    ancillariesPercent: number;
    seatsPercent: number;
  };
}

export interface DuffelStaysConfig {
  enabled: boolean;
  environment: DuffelEnvironment;
}

export interface DuffelStaysSecretBundle {
  productionToken?: string;
  testToken?: string;
  config?: DuffelStaysConfig;
}

export interface DuffelSecretBundle {
  version: 1;
  productionToken?: string;
  testToken?: string;
  config?: FlightPricingConfig;
  stays?: DuffelStaysSecretBundle;
}

export const DEFAULT_FLIGHT_PRICING_CONFIG: FlightPricingConfig = {
  environment: "test",
  usdExchangeRate: 18,
  modifiers: {
    flightsPercent: 0,
    ancillariesPercent: 0,
    seatsPercent: 0,
  },
};

export const DEFAULT_DUFFEL_STAYS_CONFIG: DuffelStaysConfig = {
  enabled: false,
  environment: "test",
};

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function finiteNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function normalizeFlightPricingConfig(
  value?: Partial<FlightPricingConfig>
): FlightPricingConfig {
  const rawModifiers: Partial<FlightPricingConfig["modifiers"]> =
    value?.modifiers || {};
  return {
    environment: value?.environment === "production" ? "production" : "test",
    usdExchangeRate: clamp(
      finiteNumber(
        value?.usdExchangeRate,
        DEFAULT_FLIGHT_PRICING_CONFIG.usdExchangeRate
      ),
      0.0001,
      1000
    ),
    modifiers: {
      flightsPercent: clamp(
        finiteNumber(rawModifiers.flightsPercent, 0),
        -100,
        1000
      ),
      ancillariesPercent: clamp(
        finiteNumber(rawModifiers.ancillariesPercent, 0),
        -100,
        1000
      ),
      seatsPercent: clamp(
        finiteNumber(rawModifiers.seatsPercent, 0),
        -100,
        1000
      ),
    },
  };
}

export function normalizeDuffelStaysConfig(
  value?: Partial<DuffelStaysConfig>
): DuffelStaysConfig {
  return {
    enabled: value?.enabled === true,
    environment: value?.environment === "production" ? "production" : "test",
  };
}

export function normalizeDuffelToken(value: unknown): string {
  return String(value || "").trim().replace(/^['"]|['"]$/g, "");
}

export function validateDuffelToken(
  token: string,
  environment: DuffelEnvironment
): void {
  const expectedPrefix =
    environment === "production" ? "duffel_live_" : "duffel_test_";
  if (!token.startsWith(expectedPrefix)) {
    throw new Error(
      environment === "production" ?
        "DUFFEL_LIVE_TOKEN_INVALID" :
        "DUFFEL_TEST_TOKEN_INVALID"
    );
  }
}

export function parseDuffelSecretBundle(rawValue: unknown): DuffelSecretBundle {
  const raw = normalizeDuffelToken(rawValue);
  const bundle: DuffelSecretBundle = {version: 1};
  if (!raw) {
    return bundle;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DuffelSecretBundle>;
    const productionToken = normalizeDuffelToken(parsed.productionToken);
    const testToken = normalizeDuffelToken(parsed.testToken);
    if (productionToken) bundle.productionToken = productionToken;
    if (testToken) bundle.testToken = testToken;
    if (parsed.config) {
      bundle.config = normalizeFlightPricingConfig(parsed.config);
    }
    if (parsed.stays) {
      const staysProductionToken = normalizeDuffelToken(
        parsed.stays.productionToken
      );
      const staysTestToken = normalizeDuffelToken(parsed.stays.testToken);
      const stays: DuffelStaysSecretBundle = {};
      if (staysProductionToken) stays.productionToken = staysProductionToken;
      if (staysTestToken) stays.testToken = staysTestToken;
      if (parsed.stays.config) {
        stays.config = normalizeDuffelStaysConfig(parsed.stays.config);
      }
      if (stays.productionToken || stays.testToken || stays.config) {
        bundle.stays = stays;
      }
    }
    if (
      bundle.productionToken ||
      bundle.testToken ||
      bundle.config ||
      bundle.stays
    ) {
      return bundle;
    }
  } catch {
    // Backwards compatibility with the original single-token secret.
  }

  if (raw.startsWith("duffel_live_")) {
    bundle.productionToken = raw;
  } else if (raw.startsWith("duffel_test_")) {
    bundle.testToken = raw;
  }
  return bundle;
}

export function serializeDuffelSecretBundle(
  bundle: DuffelSecretBundle
): string {
  return JSON.stringify({
    version: 1,
    ...(bundle.productionToken ?
      {productionToken: bundle.productionToken} :
      {}),
    ...(bundle.testToken ? {testToken: bundle.testToken} : {}),
    ...(bundle.config ?
      {config: normalizeFlightPricingConfig(bundle.config)} :
      {}),
    ...(bundle.stays ?
      {
        stays: {
          ...(bundle.stays.productionToken ?
            {productionToken: bundle.stays.productionToken} :
            {}),
          ...(bundle.stays.testToken ?
            {testToken: bundle.stays.testToken} :
            {}),
          ...(bundle.stays.config ?
            {config: normalizeDuffelStaysConfig(bundle.stays.config)} :
            {}),
        },
      } :
      {}),
  });
}

export function inferDuffelEnvironment(
  configExists: boolean,
  config: FlightPricingConfig,
  bundle: DuffelSecretBundle
): DuffelEnvironment {
  if (configExists) {
    return config.environment;
  }
  if (bundle.testToken) {
    return "test";
  }
  return bundle.productionToken ? "production" : config.environment;
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function convertUsdAmount(
  value: unknown,
  exchangeRate: number,
  modifierPercent: number
): string | undefined {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return undefined;
  }
  const converted = amount * exchangeRate;
  const mutated = converted * (1 + modifierPercent / 100);
  return roundCurrency(mutated).toFixed(2);
}

function convertPrice(
  target: JsonRecord,
  amountKey: string,
  currencyKey: string,
  config: FlightPricingConfig,
  modifierPercent: number
): void {
  const converted = convertUsdAmount(
    target[amountKey],
    config.usdExchangeRate,
    modifierPercent
  );
  if (converted === undefined) {
    return;
  }
  target[amountKey] = converted;
  target[currencyKey] = "MXN";
}

function convertCondition(
  condition: unknown,
  config: FlightPricingConfig
): void {
  if (!isRecord(condition)) return;
  convertPrice(
    condition,
    "penalty_amount",
    "penalty_currency",
    config,
    config.modifiers.flightsPercent
  );
}

function convertConditions(
  conditions: unknown,
  config: FlightPricingConfig
): void {
  if (!isRecord(conditions)) return;
  convertCondition(conditions.change_before_departure, config);
  convertCondition(conditions.refund_before_departure, config);
}

function convertAncillaryService(
  service: unknown,
  config: FlightPricingConfig,
  modifierPercent = config.modifiers.ancillariesPercent
): void {
  if (!isRecord(service)) return;
  convertPrice(
    service,
    "total_amount",
    "total_currency",
    config,
    modifierPercent
  );
}

function convertOffer(offer: unknown, config: FlightPricingConfig): void {
  if (!isRecord(offer)) return;
  for (const amountKey of ["total_amount", "base_amount", "tax_amount"]) {
    convertPrice(
      offer,
      amountKey,
      amountKey.replace("_amount", "_currency"),
      config,
      config.modifiers.flightsPercent
    );
  }
  // Duffel normally exposes only total_currency; keep all offer currencies
  // aligned after conversion even when the source omitted base/tax currency.
  offer.total_currency = "MXN";
  if (offer.base_amount !== undefined) offer.base_currency = "MXN";
  if (offer.tax_amount !== undefined) offer.tax_currency = "MXN";

  convertConditions(offer.conditions, config);
  const slices = Array.isArray(offer.slices) ? offer.slices : [];
  for (const slice of slices) {
    if (isRecord(slice)) convertConditions(slice.conditions, config);
  }
  const services = Array.isArray(offer.available_services) ?
    offer.available_services :
    [];
  for (const service of services) {
    convertAncillaryService(service, config);
  }
}

function convertSeatMaps(data: unknown, config: FlightPricingConfig): void {
  if (!Array.isArray(data)) return;
  for (const seatMap of data) {
    if (!isRecord(seatMap)) continue;
    const cabins = Array.isArray(seatMap.cabins) ? seatMap.cabins : [];
    for (const cabin of cabins) {
      if (!isRecord(cabin)) continue;
      const rows = Array.isArray(cabin.rows) ? cabin.rows : [];
      for (const row of rows) {
        if (!isRecord(row)) continue;
        const sections = Array.isArray(row.sections) ? row.sections : [];
        for (const section of sections) {
          if (!isRecord(section)) continue;
          const elements = Array.isArray(section.elements) ?
            section.elements :
            [];
          for (const element of elements) {
            if (!isRecord(element)) continue;
            const services = Array.isArray(element.available_services) ?
              element.available_services :
              [];
            for (const service of services) {
              convertAncillaryService(
                service,
                config,
                config.modifiers.seatsPercent
              );
            }
          }
        }
      }
    }
  }
}

export function applyDuffelPricing(
  payload: unknown,
  resource: string,
  config: FlightPricingConfig
): unknown {
  if (!isRecord(payload)) {
    return payload;
  }

  const data = payload.data;
  if (resource === "offers" && isRecord(data)) {
    const offers = Array.isArray(data.offers) ? data.offers : [];
    for (const offer of offers) convertOffer(offer, config);
  } else if (resource === "offer") {
    convertOffer(data, config);
  } else if (resource === "seat_maps") {
    convertSeatMaps(data, config);
  }

  const meta = isRecord(payload.meta) ? payload.meta : {};
  payload.meta = {
    ...meta,
    xplora_pricing: {
      source_currency: "USD",
      currency: "MXN",
      exchange_rate: config.usdExchangeRate,
      modifiers: config.modifiers,
    },
  };
  return payload;
}
