import { BoardTypeDefinition } from "../types/lite-api.types";

export const BoardTypeDictionarie: BoardTypeDefinition[] = [
    {
        id: "RO",
        es: "Solo Habitación",
        en: "Room Only",
        description: {
            es: "Alojamiento sin comidas ni bebidas.",
            en: "Accommodation without meals or drinks."
        },
        includes: {
            food: { breakfast: false, lunch: false, dinner: false },
            beverage: false,
            alcoholic: false,
            snacks: false,
            roomService: false
        }
    },
    {
        id: "BI",
        es: "Desayuno Incluido",
        en: "Breakfast Included",
        description: {
            es: "Alojamiento con desayuno ligero.",
            en: "Accommodation with a light breakfast."
        },
        includes: {
            food: { breakfast: true, lunch: false, dinner: false },
            beverage: true,
            alcoholic: false,
            snacks: false,
            roomService: false
        }
    },
    {
        id: "BB",
        es: "Desayuno Buffet Incluido",
        en: "Bed & Breakfast",
        description: {
            es: "Incluye desayuno tipo buffet.",
            en: "Includes buffet-style breakfast."
        },
        includes: {
            food: { breakfast: true, lunch: false, dinner: false },
            beverage: true,
            alcoholic: false,
            snacks: false,
            roomService: false
        }
    },
    {
        id: "HB",
        es: "Media Pensión",
        en: "Half Board",
        description: {
            es: "Incluye desayuno y cena.",
            en: "Includes breakfast and dinner."
        },
        includes: {
            food: { breakfast: true, lunch: false, dinner: true },
            beverage: true,
            alcoholic: false,
            snacks: false,
            roomService: false
        }
    },
    {
        id: "FB",
        es: "Pensión Completa",
        en: "Full Board",
        description: {
            es: "Incluye desayuno, almuerzo y cena.",
            en: "Includes breakfast, lunch, and dinner."
        },
        includes: {
            food: { breakfast: true, lunch: true, dinner: true },
            beverage: true,
            alcoholic: false,
            snacks: false,
            roomService: false
        }
    },
    {
        id: "AI",
        es: "Todo Incluido",
        en: "All Inclusive",
        description: {
            es: "Comidas, bebidas y snacks incluidos.",
            en: "Meals, drinks, and snacks included."
        },
        includes: {
            food: { breakfast: true, lunch: true, dinner: true },
            beverage: true,
            alcoholic: true,
            snacks: true,
            roomService: false
        }
    },
    {
        id: "UAI",
        es: "Ultra Todo Incluido",
        en: "Ultra All Inclusive",
        description: {
            es: "Comidas, minibar y room service.",
            en: "Meals, minibar, and room service."
        },
        includes: {
            food: { breakfast: true, lunch: true, dinner: true },
            beverage: true,
            alcoholic: true,
            snacks: true,
            roomService: true
        }
    },
    {
        id: "SC",
        es: "Alojamiento con Cocina",
        en: "Self Catering",
        description: {
            es: "Cocina disponible para los huéspedes.",
            en: "Kitchen available for guests."
        },
        includes: {
            food: { breakfast: false, lunch: false, dinner: false },
            beverage: false,
            alcoholic: false,
            snacks: false,
            roomService: false
        }
    },
    {
        id: "EP",
        es: "Plan Europeo",
        en: "European Plan",
        description: {
            es: "Solo habitación, sin comidas ni bebidas.",
            en: "Room only, no meals or drinks."
        },
        includes: {
            food: { breakfast: false, lunch: false, dinner: false },
            beverage: false,
            alcoholic: false,
            snacks: false,
            roomService: false
        }
    },
    {
        id: "AP",
        es: "Plan Americano",
        en: "American Plan",
        description: {
            es: "Incluye desayuno, almuerzo y cena.",
            en: "Includes breakfast, lunch, and dinner."
        },
        includes: {
            food: { breakfast: true, lunch: true, dinner: true },
            beverage: true,
            alcoholic: false,
            snacks: false,
            roomService: false
        }
    },
    {
        id: "MAP",
        es: "Plan Americano Modificado",
        en: "Modified American Plan",
        description: {
            es: "Desayuno y una comida incluidos.",
            en: "Breakfast and one meal included."
        },
        includes: {
            food: { breakfast: true, lunch: true, dinner: false },
            beverage: true,
            alcoholic: false,
            snacks: false,
            roomService: false
        }
    },
    {
        id: "PP",
        es: "Plan Premium",
        en: "Premium Plan",
        description: {
            es: "Restaurantes gourmet y servicios extra.",
            en: "Gourmet restaurants and extra services."
        },
        includes: {
            food: { breakfast: true, lunch: true, dinner: true },
            beverage: true,
            alcoholic: true,
            snacks: true,
            roomService: true
        }
    },
    {
        id: "DA",
        es: "Dine Around",
        en: "Dine Around",
        description: {
            es: "Acceso a múltiples restaurantes.",
            en: "Access to multiple restaurants."
        },
        includes: {
            food: { breakfast: true, lunch: true, dinner: true },
            beverage: true,
            alcoholic: false,
            snacks: false,
            roomService: false
        }
    }
];
