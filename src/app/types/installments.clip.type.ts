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
