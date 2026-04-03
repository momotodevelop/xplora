import { Injectable } from '@angular/core';

export type AvsCode =
  | '0'|'1'|'2'|'3'|'4'
  | 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'I'|'M'|'N'|'P'|'R'|'S'|'U'|'W'|'X'|'Y'|'Z'
  | null | undefined;

export type CvvCode =
  | '0'|'1'|'2'|'3'|'4'
  | 'E'|'I'|'M'|'N'|'P'|'S'|'U'|'X'
  | string | null | undefined;

export type ResponseCode = string | null | undefined;
export type PaymentAdviceCode = '21'|'22'|'24'|'25'|'26'|'27'|'28'|'29'|'30'|'40'|'43'|'01'|'02'|'03'|'04' | string | null | undefined;

export interface PaymentErrorInput {
  avs_code?: AvsCode;
  cvv_code?: CvvCode;
  response_code?: ResponseCode;
  payment_advice_code?: PaymentAdviceCode;
  brand?: 'VISA'|'MASTERCARD'|'DISCOVER'|'AMEX'|'MAESTRO'|string; // opcional, por si quieres matizar texto
}

export interface PaymentErrorOutput {
  title: string;            // breve y claro
  message: string;          // texto listo para UI
  code?: string;            // p.ej. "5100"
  category: 'decline'|'config'|'issuer'|'fraud'|'expired'|'pin'|'network'|'approved'|'unknown';
  retryable: boolean;       // ¿tiene sentido reintentar?
  retryAfterSeconds?: number; // cuándo reintentar, si aplica
  actions: string[];        // pasos concretos
  contextNotes?: string[];  // anexos sobre AVS/CVV
}

/** Mapas: ResponseCode -> Mensaje + metadata */
const RESPONSE_MAP: Record<string, Omit<PaymentErrorOutput, 'contextNotes'>> = {
  // Aprobado / no error
  '0000': { title: 'Pago aprobado', message: 'La transacción fue aprobada.', category: 'approved', retryable: false, actions: [] },
  '7600': { title: 'Aprobado (no capturado)', message: 'Autorizado pero no capturado. Completa la captura para finalizar el pago.', category: 'approved', retryable: false, actions: ['Intenta capturar la transacción desde tu backend.'] },

  // Declines generales
  '5100': { title: 'Pago rechazado por el emisor', message: 'El banco rechazó la transacción.', category: 'decline', retryable: true, actions: ['Reintenta más tarde o usa otra tarjeta.'] },
  '0500': { title: 'No honrar', message: 'El emisor no autorizó la compra.', category: 'decline', retryable: true, actions: ['Pide al cliente usar otra tarjeta o contactar a su banco.'] },
  '5210': { title: 'Transacción inválida', message: 'El emisor marcó la transacción como inválida.', category: 'decline', retryable: false, actions: ['Usa otro método de pago o verifica parámetros del cargo.'] },

  // Fondos/limites/PIN
  '5120': { title: 'Fondos insuficientes', message: 'La tarjeta no tiene saldo suficiente.', category: 'decline', retryable: true, actions: ['Solicita otra tarjeta o que el cliente verifique su saldo.'] },
  '5130': { title: 'PIN inválido', message: 'El PIN ingresado es inválido.', category: 'pin', retryable: true, actions: ['Reingresar PIN correctamente o usar otra tarjeta.'] },
  '5135': { title: 'Límite de intentos de PIN', message: 'Se excedieron los intentos de PIN.', category: 'pin', retryable: false, actions: ['Usar otra tarjeta o contactar a su banco.'] },
  '5500': { title: 'PIN incorrecto', message: 'El PIN es incorrecto. Intente de nuevo.', category: 'pin', retryable: true, actions: ['Reingresar PIN con cuidado.'] },

  // CVV / AVS
  '5110': { title: 'CVV incorrecto', message: 'El código de seguridad (CVV) no coincide.', category: 'fraud', retryable: true, actions: ['Reintentar ingresando el CVV correcto.', 'Si persiste, usar otra tarjeta.'] },
  '5170': { title: 'Dirección no coincide (AVS)', message: 'La verificación de dirección falló.', category: 'fraud', retryable: true, actions: ['Corregir dirección y CP.', 'Reintentar.'] },
  '5190': { title: 'Tarjeta inválida o restringida', message: 'El emisor marcó la tarjeta como inválida o restringida.', category: 'decline', retryable: false, actions: ['Usar otra tarjeta.'] },
  '5400': { title: 'Tarjeta expirada', message: 'La tarjeta ya expiró.', category: 'expired', retryable: false, actions: ['Actualizar fecha de expiración o usar otra tarjeta.'] },

  // Cierres / robos / fraude
  '5140': { title: 'Tarjeta cerrada', message: 'La cuenta de la tarjeta fue cerrada.', category: 'issuer', retryable: false, actions: ['Solicitar otra tarjeta.'] },
  '9520': { title: 'Tarjeta reportada (robada/perdida)', message: 'El emisor reporta la tarjeta como perdida o robada.', category: 'fraud', retryable: false, actions: ['No reintentar. Solicitar otro medio de pago.'] },
  '9500': { title: 'Sospecha de fraude', message: 'El emisor sospecha actividad fraudulenta.', category: 'fraud', retryable: false, actions: ['No reintentar con esta tarjeta.', 'Pedir otra tarjeta.'] },
  '5150': { title: 'Retener tarjeta (condiciones especiales)', message: 'El emisor requiere manejo especial. No reintentar.', category: 'fraud', retryable: false, actions: ['Usar otra tarjeta.'] },

  // Reintentos/3DS/SCA
  '5650': { title: 'SCA requerida', message: 'Se requiere autenticación reforzada del cliente.', category: 'issuer', retryable: true, actions: ['Reintentar con 3DS/SCA habilitado.'] },
  '7700': { title: 'Error 3DS', message: 'Falló la autenticación 3D Secure.', category: 'issuer', retryable: true, actions: ['Reintentar autenticación 3DS.', 'Usar otra tarjeta si persiste.'] },
  '7710': { title: 'Autenticación fallida', message: 'El tarjetahabiente no pasó la autenticación.', category: 'issuer', retryable: true, actions: ['Reintentar autenticación o usar otro método.'] },
  '9100': { title: 'Rechazado: intenta de nuevo', message: 'El emisor sugiere reintentar.', category: 'issuer', retryable: true, actions: ['Reintentar en unos minutos.'] },

  // Duplicados y estados
  '5200': { title: 'Transacción duplicada', message: 'Se detectó un cargo duplicado.', category: 'issuer', retryable: false, actions: ['Evita reintentar inmediato.', 'Valida si el primer cargo fue exitoso.'] },

  // Emisor no disponible / red
  '5910': { title: 'Emisor no disponible (no reintentar)', message: 'El banco no está disponible (no reintentar).', category: 'issuer', retryable: false, actions: ['Usar otra tarjeta o intentar más tarde.'] },
  '5920': { title: 'Emisor no disponible (reintentar)', message: 'El banco no está disponible temporalmente.', category: 'issuer', retryable: true, actions: ['Reintentar más tarde.'] },
  '8220': { title: 'Sistema no disponible', message: 'Servicio no disponible temporalmente.', category: 'network', retryable: true, actions: ['Reintentar más tarde.'] },
  '8110': { title: 'Error de comunicación (reintentar)', message: 'Falla de comunicación con el procesador.', category: 'network', retryable: true, actions: ['Reintentar en unos minutos.'] },
  '8100': { title: 'Error de comunicación fatal', message: 'Falla crítica de comunicación.', category: 'network', retryable: true, actions: ['Reintentar más tarde.', 'Si persiste, contactar soporte.'] },
  '8000': { title: 'Error del procesador', message: 'Falla del sistema del procesador.', category: 'network', retryable: true, actions: ['Reintentar más tarde.'] },

  // Configuración/comercio/datos
  '1300': { title: 'Formato de datos inválido', message: 'Los datos enviados no cumplen el formato.', category: 'config', retryable: false, actions: ['Corrige el payload antes de reintentar.'] },
  '1310': { title: 'Monto inválido', message: 'El monto es inválido.', category: 'config', retryable: false, actions: ['Corrige el monto y reintenta.'] },
  '1320': { title: 'Moneda inválida', message: 'Código de moneda inválido o no soportado.', category: 'config', retryable: false, actions: ['Ajusta la moneda a una soportada.'] },
  '1330': { title: 'Cuenta inválida', message: 'La cuenta de la tarjeta es inválida.', category: 'issuer', retryable: false, actions: ['Usar otra tarjeta.'] },
  '1350': { title: 'Comercio inválido', message: 'El comercio no está habilitado.', category: 'config', retryable: false, actions: ['Revisa configuración del merchant/processor.'] },
  '1340': { title: 'Terminal inválida', message: 'Terminal o MID no válido.', category: 'config', retryable: false, actions: ['Verifica credenciales/entorno.'] },
  '1380': { title: 'Expiración inválida', message: 'Fecha de expiración inválida.', category: 'config', retryable: false, actions: ['Corrige MM/YY y reintenta.'] },
  '1382': { title: 'CVV inválido', message: 'CVV inválido o malformado.', category: 'config', retryable: false, actions: ['Capturar CVV correcto.'] },
  '8030': { title: 'Operación no soportada', message: 'El procesador no soporta esta operación.', category: 'config', retryable: false, actions: ['Usar un flujo soportado.'] },

  // Varios relevantes
  '5950': { title: 'Cuenta actualizada', message: 'La tarjeta fue reemplazada/actualizada.', category: 'issuer', retryable: false, actions: ['Usar la nueva tarjeta del cliente.'] },
  'PPAB': { title: 'Cuenta bloqueada por el emisor', message: 'El emisor bloqueó temporalmente la cuenta.', category: 'issuer', retryable: false, actions: ['Solicitar otra tarjeta.'] },
  'PPCT': { title: 'Tipo de tarjeta no soportado', message: 'Este método no soporta el tipo de tarjeta.', category: 'config', retryable: false, actions: ['Usar otra tarjeta o habilitar el tipo.'] },
  'PPCU': { title: 'Moneda no soportada', message: 'La moneda usada no es válida para el flujo.', category: 'config', retryable: false, actions: ['Cambiar a una moneda soportada.'] },
  'PPEF': { title: 'Instrumento de pago expirado', message: 'La forma de pago está caducada.', category: 'issuer', retryable: false, actions: ['Actualizar tarjeta o usar otra.'] },
  'PPD3': { title: 'Error 3DS (plataforma)', message: 'Fallo de 3DS en pasarela.', category: 'issuer', retryable: true, actions: ['Reintentar con 3DS.'] },
  'PPRN': { title: 'Reintento no permitido', message: 'El procesador prohibe reintentar esta operación.', category: 'issuer', retryable: false, actions: ['No reintentar. Usa otra tarjeta.'] },
  'PP06': { title: 'Cuenta cerrada', message: 'La cuenta antes abierta ahora está cerrada.', category: 'issuer', retryable: false, actions: ['Solicitar otra tarjeta.'] },
  '9600': { title: 'Respuesta no reconocida', message: 'El procesador devolvió un código no reconocido.', category: 'unknown', retryable: true, actions: ['Reintentar o usar otro método.'] },
};

const DEFAULT_RESPONSE: Omit<PaymentErrorOutput, 'contextNotes'> = {
  title: 'Pago rechazado',
  message: 'No fue posible completar el pago.',
  category: 'unknown',
  retryable: true,
  actions: ['Reintentar más tarde o usar otra tarjeta.'],
};

/** AVS -> notas breves en español para anexar contexto */
const AVS_NOTES: Record<string, string> = {
  'A': 'AVS: dirección coincide, CP no.',
  'Z': 'AVS: CP coincide, dirección no.',
  'Y': 'AVS: dirección y CP (5 dígitos) coinciden.',
  'X': 'AVS: dirección + ZIP de 9 dígitos coinciden.',
  'N': 'AVS: nada coincide.',
  'U': 'AVS: servicio no disponible.',
  'R': 'AVS: reintentar (servicio temporalmente no disponible).',
  'M': 'AVS: nombre, dirección y CP coinciden (AMEX) / dirección+CP (V/MC/Disc).',
  'D': 'AVS internacional: coincide dirección y CP.',
  'C': 'AVS internacional: nada coincide.',
  'B': 'AVS internacional: dirección coincide.',
  'P': 'AVS internacional: solo CP.',
  'W': 'AVS: ZIP completo coincide; AMEX indica nombre/dirección/CP incorrectos.',
  'S': 'AVS no soportado.',
  'E': 'AVS no permitido para internet/teléfono.',
  'G': 'AVS global no disponible.',
  'I': 'AVS internacional no disponible.',
  '0': 'AVS Maestro: todo coincide.',
  '1': 'AVS Maestro: nada coincide.',
  '2': 'AVS Maestro: coincidencia parcial.',
  '3': 'AVS Maestro: sin datos de AVS del comercio.',
  '4': 'AVS Maestro: no verificado / sin respuesta.',
};

/** CVV -> notas breves en español para anexar contexto */
const CVV_NOTES: Record<string, string> = {
  'M': 'CVV: coincide.',
  'N': 'CVV: no coincide.',
  'I': 'CVV: inválido o nulo.',
  'E': 'CVV: respuesta desconocida.',
  'P': 'CVV: no procesado.',
  'S': 'CVV: no soportado.',
  'U': 'CVV: emisor no certificado.',
  'X': 'CVV: sin respuesta.',
  '0': 'CVV Maestro: coincide.',
  '1': 'CVV Maestro: no coincide.',
  '2': 'CVV Maestro: comercio no implementó manejo de CVV2.',
  '3': 'CVV Maestro: CVV2 no presente en la tarjeta.',
  '4': 'CVV Maestro: servicio no disponible.',
};

function adviceToSeconds(code?: PaymentAdviceCode): number | undefined {
  switch (code) {
    case '24': return 60 * 60;            // 1 hora
    case '25': return 24 * 60 * 60;       // 24 horas
    case '26': return 2 * 24 * 60 * 60;   // 2 días
    case '27': return 4 * 24 * 60 * 60;   // 4 días
    case '28': return 6 * 24 * 60 * 60;   // 6 días
    case '29': return 8 * 24 * 60 * 60;   // 8 días
    case '30': return 10 * 24 * 60 * 60;  // 10 días
    default: return undefined;
  }
}

function adviceHardStop(code?: PaymentAdviceCode): boolean {
  // Códigos que implican NO reintentar esa relación de cobro (recurrencias, fraude, etc.)
  return code === '21' || code === '02' || code === '03';
}

@Injectable({ providedIn: 'root' })
export class PaymentErrorService {

  /**
   * Construye un mensaje de error claro basado en response_code (prioridad),
   * y añade contexto de AVS/CVV + recomendaciones por payment_advice_code.
   */
  buildErrorMessage(input: PaymentErrorInput): PaymentErrorOutput {
    const rc = (input.response_code ?? '').toString().trim();
    const base = RESPONSE_MAP[rc] ?? DEFAULT_RESPONSE;

    // Clonar para no mutar mapas
    const out: PaymentErrorOutput = {
      title: base.title,
      message: base.message,
      code: rc || undefined,
      category: base.category,
      retryable: base.retryable,
      retryAfterSeconds: base.retryAfterSeconds,
      actions: [...base.actions],
      contextNotes: [],
    };

    // Reglas específicas de "no reintentar" por response_code "duros"
    const DO_NOT_RETRY_CODES = new Set(['5150','5190','9520','9500','PPRN']); // pickup/restringidas/robada/fraude/reintento prohibido
    if (DO_NOT_RETRY_CODES.has(rc)) {
      out.retryable = false;
    }

    // Payment Advice: define ventanas de reintento o hard stop para recurrencias
    const advice = input.payment_advice_code;
    const wait = adviceToSeconds(advice);
    if (wait) {
      out.retryable = true;
      out.retryAfterSeconds = wait;
      out.contextNotes?.push(`Sugerencia de la red: reintentar en ~${Math.round(wait/3600)}h (advice ${advice}).`);
    }
    if (adviceHardStop(advice)) {
      out.retryable = false;
      out.contextNotes?.push(`La red indica detener reintentos de este cargo recurrente (advice ${advice}).`);
      // Sustituir acciones a algo prudente
      out.actions = ['No reintentar este cargo.', 'Contactar al cliente para acordar otra forma de pago.'];
    }

    // AVS/CVV: agregamos notas contextuales sin cambiar el núcleo (a menos que falte mensaje)
    const avs = (input.avs_code ?? '').toString().toUpperCase();
    const cvv = (input.cvv_code ?? '').toString().toUpperCase();

    if (AVS_NOTES[avs]) out.contextNotes?.push(AVS_NOTES[avs]);
    if (CVV_NOTES[cvv]) out.contextNotes?.push(CVV_NOTES[cvv]);

    // Si el código principal es vacío pero AVS/CVV dan pista, ajusta un mensaje útil
    if (!rc && (avs || cvv)) {
      out.title = 'Validación de tarjeta inconclusa';
      out.message = 'No se obtuvo un código de respuesta del procesador, pero AVS/CVV aportan contexto.';
      out.category = 'unknown';
      out.retryable = true;
      if (!out.actions.length) out.actions = ['Verifica los datos e inténtalo de nuevo.'];
    }

    // Pulimos acciones redundantes (evita duplicados)
    out.actions = Array.from(new Set(out.actions));

    return out;
  }
}