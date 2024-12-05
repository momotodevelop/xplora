export interface PaymentMethod {
    id: string;
    type: string;
    issuer_id: string;
    data: {
        routing_data: {
            merchant_account_id: string;
        };
    };
}

export interface Identification {
    number: string | null;
    type: string | null;
}

export interface Payer {
    identification: Identification;
    entity_type: string | null;
    phone: {
        number: string | null;
        extension: string | null;
        area_code: string | null;
    };
    last_name: string | null;
    id: string;
    type: string | null;
    first_name: string | null;
    email: string;
}

export interface TransactionDetails {
    payment_method_reference_id: string | null;
    acquirer_reference: string | null;
    net_received_amount: number;
    total_paid_amount: number;
    overpaid_amount: number;
    external_resource_url: string | null;
    installment_amount: number;
    financial_institution: string | null;
    payable_deferral_period: string | null;
}

export interface FeeDetail {
    type: string;
    fee_payer: string;
    amount: number;
}

export interface Amounts {
    original: number;
    refunded: number;
}

export interface ChargesDetail {
    id: string;
    name: string;
    type: string;
    accounts: {
        from: string;
        to: string;
    };
    client_id: number;
    date_created: string;
    last_updated: string;
    amounts: Amounts;
    metadata: {
        source: string;
    };
    reserve_id: string | null;
    refund_charges: any[];
}

export interface Cardholder {
    name: string;
    identification: Identification;
}

export interface Card {
    id: string | null;
    first_six_digits: string;
    last_four_digits: string;
    expiration_month: number;
    expiration_year: number;
    date_created: string;
    date_last_updated: string;
    country: string | null;
    tags: string | null;
    cardholder: Cardholder;
}

export interface BusinessInfo {
    unit: string;
    sub_unit: string;
    branch: string | null;
}

export interface PointOfInteraction {
    type: string;
    business_info: BusinessInfo;
}

export interface ApiResponse {
    status: number;
    headers: {
        date: string[];
        "content-type": string[];
        "transfer-encoding": string[];
        connection: string[];
        "x-site-id": string[];
        "x-response-status": string[];
        "x-caller-id": string[];
        vary: string[];
        "cache-control": string[];
        etag: string[];
        "x-content-type-options": string[];
        "x-request-id": string[];
        "x-xss-protection": string[];
        "strict-transport-security": string[];
        "access-control-allow-origin": string[];
        "access-control-allow-headers": string[];
        "access-control-allow-methods": string[];
        "access-control-max-age": string[];
        "timing-allow-origin": string[];
    };
}

export interface Payment {
    id: number;
    date_created: string;
    date_approved: string;
    date_last_updated: string;
    date_of_expiration: string | null;
    money_release_date: string;
    money_release_status: string;
    operation_type: string;
    issuer_id: string;
    payment_method_id: string;
    payment_type_id: string;
    payment_method: PaymentMethod;
    status: string;
    status_detail: string;
    currency_id: string;
    description: string | null;
    live_mode: boolean;
    sponsor_id: string | null;
    authorization_code: string;
    money_release_schema: string | null;
    taxes_amount: number;
    counter_currency: string | null;
    brand_id: string | null;
    shipping_amount: number;
    build_version: string;
    pos_id: string | null;
    store_id: string | null;
    integrator_id: string | null;
    platform_id: string | null;
    corporation_id: string | null;
    payer: Payer;
    collector_id: number;
    marketplace_owner: string | null;
    metadata: metadata;
    additional_info: {
        available_balance: string | null;
        nsu_processadora: string | null;
        authentication_code: string | null;
    };
    order: object;
    external_reference: string | null;
    transaction_amount: number;
    transaction_amount_refunded: number;
    coupon_amount: number;
    differential_pricing_id: string | null;
    financing_group: string | null;
    deduction_schema: string | null;
    installments: number;
    transaction_details: TransactionDetails;
    fee_details: FeeDetail[];
    charges_details: ChargesDetail[];
    captured: boolean;
    binary_mode: boolean;
    call_for_authorize_id: string | null;
    statement_descriptor: string | null;
    card: Card;
    notification_url: string | null;
    refunds: any[];
    processing_mode: string;
    merchant_account_id: string | null;
    merchant_number: string | null;
    acquirer_reconciliation: any[];
    point_of_interaction: PointOfInteraction;
    accounts_info: string | null;
    tags: string | null;
    api_response: ApiResponse;
    uid: string;
    bookingID: string;
}
export interface metadata{
    payment_point?: string
}
