interface Payment {
    paymentType: string;
    selectedPaymentMethod: string;
    formData: FormDataCash;
}

interface FormDataCash {
    payment_method_id: string;
    transaction_amount: number;
    payer: Payer;
    metadata: Metadata;
    additional_info: AdditionalInfo;
}

interface Payer {
    email: string;
    first_name: string;
    last_name: string;
}

interface Metadata {
    payment_point: string;
}

interface AdditionalInfo {
    items: Item[];
}

interface Item {
    unit_price: number;
    quantity: number;
    title: string;
}
export interface PreferenceDataMP{
    additional_info: string;
    auto_return: string;
    back_urls: {
        failure: string;
        pending: string;
        success: string;
    };
    binary_mode: boolean;
    client_id: string;
    collector_id: number;
    coupon_code?: any;
    date_created: string;
    expires: boolean;
    external_reference: string;
    id: string;
    init_point: string;
    items: Array<{
        id: string;
        category_id: string;
        currency_id: string;
        description: string;
        title: string;
        quantity: number;
        unit_price: number;
    }>;
    marketplace: string;
    marketplace_fee: number;
    payer: {
        phone: {
            area_code: string;
            number: string;
        },
        address: {
            zip_code: string;
            street_name: string;
            street_number?: number;
        },
        email: string;
        identification: {
            number: string;
            type: string;
        },
        name: string;
        surname: string;
    };
    payment_methods: {
        excluded_payment_methods: Array<{ id: string }>;
        excluded_payment_types: Array<{ id: string }>;
    };
    site_id: string;
    shipments: {
        receiver_address: {
            zip_code: string;
            street_name: string;
            street_number?: number;
            floor: string;
            apartment: string;
        }
    };
    statement_descriptor: string;
    sandbox_init_point: string;
}

export interface DiscountsMP{
    totalDiscountsAmount:number;
    discountsList: {name:string, value:number}[]
}

export interface CreatePaymentRequestData{
    paymentType: string;
    selectedPaymentMethod: string;
    formData: any;
}

export type PaymentType = 'credit_card'|'debit_card'|'ticket'|'wallet_purchase'|'atm'|'onboarding_credits';
  // Interfaz para los datos del pagador
interface Payer {
    email: string;
    first_name: string;
    last_name: string;
    // Otros campos opcionales para distintos métodos de pago
    identification?: {
        type: string;
        number: string;
    };
    phone?: {
        area_code: string;
        number: string;
    };
}
  // Interfaz para los metadatos
interface Metadata {
    payment_point: string;
    issuer_id?: string;
    cardholder_name?: string;
    cardholder_id_number?: string;
    [key: string]: any; // Otros campos adicionales
}

  // Interfaz para los datos del formulario (formData)
interface FormData {
    payment_method_id: string;
    transaction_amount: number;
    payer: Payer;
    token?: string; // Token de la tarjeta (para pagos con tarjeta)
    installments?: number; // Cuotas (para pagos con tarjeta)
    issuer_id?: string; // Emisor de la tarjeta
    payment_method_option_id?: string; // Opciones de métodos de pago
    binary_mode?: boolean; // Pago en modo binario
    metadata?: Metadata;
    [key: string]: any; // Otros campos adicionales
}

  // Interfaz para el objeto completo de datos de pago
export interface PaymentData {
    paymentType: PaymentType;
    selectedPaymentMethod: string;
    formData: FormData;
}