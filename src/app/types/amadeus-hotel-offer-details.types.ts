export interface HotelOfferDetailsResponse {
    data: {
        type: string; // Tipo de dato principal, por ejemplo, "hotel-offers"
        hotel: {
            type: string; // Tipo de hotel, por ejemplo, "hotel"
            hotelId: string; // ID único del hotel
            chainCode: string; // Código de la cadena del hotel
            name: string; // Nombre del hotel
            cityCode: string; // Código de la ciudad
            address: {
                countryCode: string; // Código del país
            };
            amenities: string[]; // Lista de comodidades disponibles en el hotel
        };
        available: boolean; // Indica si hay disponibilidad
        offers: Offer[]; // Lista de ofertas disponibles
    };
    meta: {
        lang: string; // Idioma de los datos
    };
}
  // Interfaz para una oferta individual
export interface Offer {
    id: string; // ID único de la oferta
    checkInDate: string; // Fecha de check-in
    checkOutDate: string; // Fecha de check-out
    rateCode: string; // Código de la tarifa
    description: Description; // Descripción de la oferta
    room: {
      type: string; // Tipo de habitación, por ejemplo, "REG"
      description: Description; // Descripción de la habitación
    };
    guests: {
      adults: number; // Número de adultos
    };
    price: Price; // Detalles de precio
    policies: Policies; // Políticas de cancelación y pago
}
  // Interfaz para descripciones
export interface Description {
    text: string; // Texto de la descripción
    lang: string; // Idioma de la descripción
}
  // Interfaz para detalles del precio
export interface Price {
    currency: string; // Moneda, por ejemplo, "USD"
    base: string; // Precio base
    total: string; // Precio total
    taxes: Tax[]; // Lista de impuestos
    variations: {
      changes: Variation[]; // Cambios en el precio
    };
}
  // Interfaz para impuestos
export interface Tax {
    code: string; // Código del impuesto
    pricingFrequency: string; // Frecuencia de cobro, por ejemplo, "PER_STAY"
    pricingMode: string; // Modo de cobro, por ejemplo, "PER_PRODUCT"
    amount: string; // Cantidad del impuesto
    currency: string; // Moneda del impuesto
    included: boolean; // Indica si el impuesto está incluido en el precio
}
  // Interfaz para variaciones de precio
export interface Variation {
    startDate: string; // Fecha de inicio de la variación
    endDate: string; // Fecha de finalización de la variación
    base: string; // Precio base durante el período
}
  // Interfaz para políticas de la oferta
export interface Policies {
    cancellations: CancellationPolicy[]; // Lista de políticas de cancelación
    paymentType: string; // Tipo de pago, por ejemplo, "guarantee"
}
  // Interfaz para políticas de cancelación
export interface CancellationPolicy {
    numberOfNights: number; // Número de noches afectadas por la política
    deadline: string; // Fecha límite para cancelar
    amount: string; // Monto de la penalización
}  