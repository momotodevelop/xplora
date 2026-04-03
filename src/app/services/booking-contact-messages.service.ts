import { Injectable } from '@angular/core';
import { Liquid } from 'liquidjs';
import { VoucherPrintable } from './voucher-transform.service';

export type BookingContactTemplateKey =
  | 'booking_received'
  | 'payment_pending'
  | 'discount_payment_spei'

@Injectable({ providedIn: 'root' })
export class BookingContactMessagesService {
  private engine = new Liquid({
    // seguridad básica: evita comportamientos raros
    strictFilters: false,
    strictVariables: false,
    trimTagRight: false,
    trimTagLeft: true,
  });

  // Templates basados en VoucherPrintable
  private templates: Record<BookingContactTemplateKey, string> = {
    booking_received: `
Hola {{ voucher.contact.name | default: "Hola" }} 👋
Hemos recibido tu solicitud de reservación para los siguientes servicios. Por favor, verifica que la información sea correcta y si tienes alguna duda, no dudes en contactarnos. Estamos aquí para ayudarte en todo lo que necesites.
⚫️ PNR: {{ voucher.pnr }}
🟡 Estatus: Pendiente
🔵 Método de pago seleccionado: {{ voucher.payment.method }}
Detalles del itinerario:
{% for s in voucher.services %}
✈️ {{ s.origin }} → {{ s.destination }}
🛫 Salida: {{ s.start.date }} {{ s.start.time }}
🛬 Llegada: {{ s.end.date }} {{ s.end.time }}
{% endfor %}
Pasajeros:
{% for p in voucher.passengers %}
  👤 {{ p.name }}
{% endfor %}
Contacto: {{ voucher.contact.email | default: "N/D" }} | {{ voucher.contact.phone | default: "N/D" }}
    `.trim(),

    payment_pending: `
Hola {{ voucher.contact.name | default: "Hola" }} 👋
Tu reservación (PNR: {{ voucher.pnr }}) está lista, pero necesitamos completar el pago para confirmarla.

{% if voucher.payment.totalDue %}
Total a pagar: {{ voucher.payment.totalDue }}
{% endif %}

{% assign method = voucher.payment.method | default: "otro" | downcase %}
{% assign booking_status = voucher.status | default: "" | upcase %}
{% assign payment_status = voucher.payment.status | default: "" | upcase %}
Metodo de pago seleccionado: {{ voucher.payment.method | default: "Otro" }}

{% if method contains "tarjeta" %}
Lamentablemente el pago de tu reservación no se ha completado. Podemos enviarte un nuevo enlace o cambiar de método de pago para asegurar la tarifa y disponibilidad de tu reservación.
{% elsif method contains "efectivo" %}
Lamentablemente aún no hemos recibido el pago en efectivo para tu reservación. Si ya realizaste el pago, por favor envíanos una foto o el comprobante para validarlo.

Si aún no lo realizas, te invitamos a completar el pago lo antes posible para asegurar la tarifa y disponibilidad de tu reservación.

¿Prefieres cambiar a otro método de pago como tarjeta o transferencia SPEI? Estamos aquí para ayudarte a completar el proceso.
{% elsif method contains "spei" %}
Lamentablemente aún no hemos recibido la transferencia SPEI para tu reservación. Si ya realizaste el pago, por favor envíanos una foto o el comprobante para validarlo.

Si aún no lo realizas, te invitamos a completar el pago lo antes posible para asegurar la tarifa y disponibilidad de tu reservación.

¿Prefieres cambiar a otro método de pago como tarjeta o efectivo? Estamos aquí para ayudarte a completar el proceso.
{% else %}
Estamos a tiempo para completar tu pago. ¿Prefieres reintentar con tarjeta o cambiar a efectivo/SPEI? Si necesitas más tiempo, avísanos y buscaremos extender el plazo.
{% endif %}
    `.trim(),

    discount_payment_spei: `
{%- assign method = voucher.payment.method | default: "otro" | downcase -%}
{%- if method contains "tarjeta" -%}
Notamos que lamentablemente tu pago con tarjeta no se ha completado por motivos de seguridad. Te sugerimos comunicarte con tu banco para autorizar la transacción o considerar otro método de pago como efectivo o transferencia SPEI.
En caso de que te interese, en compensación por los inconvenientes en el proceso de pago podemos ofrecerte un descuento adicional del 15% sobre el total de tu reservación realizando el pago de tu reservación a traves de Transferencia SPEI.
{%- elsif method contains "efectivo" -%}
Recientemente se han presentado intermitencias en el servicio de pagos en efectivo, podrías experimentar problemas para completar tu pago. Si necesitas ayuda o se presenta algún rechazo, no dudes en comunicarte con nosotros para asistirte.

Como alternativa, te ofrecemos un descuento adicional del 15% sobre el total de tu reservación si realizas el pago a través de Transferencia SPEI. Estamos aquí para ayudarte a completar el proceso de manera rápida y sencilla.
{%- elsif method contains "spei" -%}
Notamos que tu pago por transferencia SPEI aún no se ha completado. Nos interesa que completes tu compra y puedas realizar tu viaje con la mejor tarifa posible.
Por ello, si decides completar tu pago por transferencia SPEI en este momento, te ofrecemos un descuento adicional del 15% sobre el total de tu reservación.
Si necesitas ayuda para completar el proceso, no dudes en contactarnos. Estamos aquí para asistirte.
{% else %}
Tu reservación está casi lista, pero necesitamos completar el pago para confirmarla.
Para facilitar el proceso, te ofrecemos un descuento adicional del 15% sobre el total de tu reservación si realizas el pago a través de Transferencia SPEI.
Si necesitas ayuda o tienes alguna pregunta, no dudes en contactarnos. Estamos aquí para asistirte.
{% endif %}
    `.trim()
  };

  async render(key: BookingContactTemplateKey, voucher: VoucherPrintable): Promise<string> {
    const tpl = this.templates[key];
    if (!tpl) throw new Error(`Template no existe: ${key}`);
    // Envuelvo como { voucher } para que el template sea estable y no se rompa
    return this.engine.parseAndRender(tpl, { voucher });
  }

  // Sync wrapper opcional (LiquidJS render es async por diseño)
  // Si necesitas 100% sync, te digo cómo dejarlo sync con un motor más simple,
  // pero perderías cosas (o meterías eval, y eso es mala idea).
}
