export interface InstallmentsResponse {
    payment_method_id: string;
    type: string;
    issuer: Issuer;
    validations: Validation[];
    installments: Installment[];
    tags: string[];
}

export interface Issuer {
    default: boolean;
    name: string;
    country: string;
}

export interface Validation {
    name: string;
    metadata: ValidationMetadata;
}

export interface ValidationMetadata {
    exclusion_pattern?: string;
    pattern?: string;
    algorithm?: string;
    length?: number;
    card_location?: string;
    type?: string;
    min?: number;
}

export interface Installment {
    quantity: number;
    fee: number;
    amount: number;
    total_amount: number;
}

export interface PaymentResponseData {
    id: string;
    amount: number;
    tip_amount: number;
    amount_refunded: number;
    installment_amount: number;
    installments: number;
    capture_method: string;
    net_amount: number;
    paid_amount: number;
    binary_mode: boolean;
    country: string;
    currency: string;
    description: string;
    external_reference: string;
    customer: {
        address: {
        country: string;
        postal_code: string;
        state: string;
        city: string;
        colony: string;
        street: string;
        exterior_number: string;
        internal_number: string;
        reference: string;
        };
        description: string;
        email: string;
        first_name: string;
        identification: {
        id: string;
        type: string;
        };
        last_name: string;
        phone: string;
    };
    payment_method: {
        id: string;
        type: string;
        card: {
        bin: string;
        issuer: string;
        name: string;
        country: string;
        last_digits: string;
        exp_year: string;
        exp_month: string;
        loyalty: {
            apply: string;
        };
        };
        token: string;
    };
    pending_action?: {type: string;url: string;} | {};
    receipt_no: string;
    claims: any[];  // Si quieres, puedo tiparlo mejor si sabes la estructura de los elementos
    refunds: any[]; // Igual aquí
    statement_descriptor: string;
    status: string;
    status_detail: {
        code: string;
        message: string;
    };
    metadata: Record<string, any>;
    return_url: string;
    webhook_url: string;
    prevention_data: {
        session_id: string;
        device_finger_print_token: string;
        customer_type: string;
        customer_risk_score: number;
        transaction_risk_level: string;
        user_agent: string;
        validation_mode: string;
    };
    location: {
        ip: string;
    };
    created_at: string; // ISO 8601 datetime string
    updated_at?: string;
    version: number;
}

