export interface SitePhone {
  label: string;
  countryCode: string;
  lada: string;
  phone: string;
}

export interface SiteIdentityConfig {
  brand: {
    name: string;
    shortName: string;
    websiteUrl: string;
    websiteDomain: string;
    logoLightPath: string;
    logoDarkPath: string;
    primaryColor: string;
  };
  legal: {
    companyName: string;
    rfc: string;
    address: string;
  };
  contact: {
    email: string;
    phones: SitePhone[];
    whatsapp: SitePhone;
    social: {
      facebook: string;
      instagram: string;
    };
  };
}

export const SITE_IDENTITY_CONFIG: SiteIdentityConfig = {
  brand: {
    name: 'Xplora Travel',
    shortName: 'Xplora',
    websiteUrl: 'https://xploratravel.com.mx',
    websiteDomain: 'xploratravel.mx',
    logoLightPath: 'assets/img/general/logo-light.svg',
    logoDarkPath: 'assets/img/general/logo-dark.svg',
    primaryColor: '#004AAD'
  },
  legal: {
    companyName: 'Venderas S.C.',
    rfc: 'VEN170120AS1',
    address: 'Blvd. Francisco Medina Ascencio Sin Numero, Oficina 134, Puerto Vallarta, Jalisco, C.P.: 48335, México'
  },
  contact: {
    email: 'contacto@xploratravel.mx',
    phones: [
      {
        label: 'Lada Sin Costo',
        countryCode: '52',
        lada: '800',
        phone: '4611485'
      },
      {
        label: 'Atención 24/7',
        countryCode: '52',
        lada: '55',
        phone: '99632698'
      }
    ],
    whatsapp: {
      label: 'WhatsApp',
      countryCode: '52',
      lada: '56',
      phone: '65851512'
    },
    social: {
      facebook: 'https://www.facebook.com/xplora.travel.mx',
      instagram: 'https://www.instagram.com/xplora.trips'
    }
  }
};
