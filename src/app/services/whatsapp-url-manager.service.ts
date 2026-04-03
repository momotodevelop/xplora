import { Injectable } from '@angular/core';

export type WhatsAppTemplateID =
  | 'ayudaPago'
  | 'contactoDirecto'
  | 'expirado'
  | 'ayudaAeropuerto'
  | 'desvioConmutador'
  | 'confirmarReservacion'
  | 'cotizarPromo'
  | 'cambiarPago'
  | 'recordatorioPago';

@Injectable({
  providedIn: 'root'
})
export class WhatsAppUrlManagerService {
  private readonly baseNumber = '5215667662363';

  private readonly templates: Record<WhatsAppTemplateID, string> = {
    ayudaPago: 'Hola, necesito ayuda para completar mi pago en Xplora Travel. El sistema no me permitió finalizar el proceso y quiero asegurar mi reserva. Mi clave de confirmación es {{clave}}.',
    contactoDirecto: 'Hola, los contacto desde xploratravel.mx. Tengo algunas dudas y me gustaría recibir asistencia.',
    expirado: 'Hola, mi tiempo para pagar ya expiró y quiero saber si aún puedo completar el pago y mantener mi reservación en Xplora Travel. Mi clave de confirmación es {{clave}}.',
    ayudaAeropuerto: 'Hola, necesito atención inmediata en el aeropuerto.',
    desvioConmutador: 'Hola, vengo del conmutador de Xplora Travel. El tiempo de espera era alto y deseo continuar mi asistencia por WhatsApp. Mi clave de confirmación es {{clave}}.',
    confirmarReservacion: 'Hola, necesito confirmar la información de mi reservación con Xplora Travel.',
    cotizarPromo: 'Hola, me gustaría cotizar un vuelo con su promoción de aniversario. ¿Podrían ayudarme, por favor?',
    cambiarPago: 'Hola, deseo cambiar el método de pago de mi reservación en Xplora Travel. Mi clave de confirmación es {{clave}}. ¿Cómo puedo proceder para completar el pago?',
    recordatorioPago: 'Hola {{nombre}}, tu reservación con número {{reserva}} está pendiente de pago. ¿Deseas completarla ahora?'
  };

  constructor() {}

  private extractPlaceholders(template: string): string[] {
    const matches = [...template.matchAll(/{{(.*?)}}/g)];
    return matches.map((m) => m[1].trim());
  }

  private replacePlaceholders(template: string, data: Record<string, string>): string {
    return template.replace(/{{(.*?)}}/g, (_, key) => data[key.trim()]);
  }

  public redirectToMessage(id: WhatsAppTemplateID, data?: Record<string, string>): void {
    const url = this.getUrlFromTemplate(id, data);
    window.open(url, '_blank');
  }

  public getUrlFromTemplate(id: WhatsAppTemplateID, data?: Record<string, string>): string {
    const template = this.templates[id];
    if (!template) {
      throw new Error(`Plantilla con ID '${id}' no encontrada.`);
    }

    const placeholders = this.extractPlaceholders(template);

    if (placeholders.length > 0 && !data) {
      throw new Error(`La plantilla '${id}' requiere datos: ${placeholders.join(', ')}`);
    }

    const missing = placeholders.filter((key) => !data?.[key]);
    if (missing.length > 0) {
      throw new Error(`Faltan datos para la plantilla '${id}': ${missing.join(', ')}`);
    }

    const finalMessage = data ? this.replacePlaceholders(template, data) : template;
    const encodedMessage = encodeURIComponent(finalMessage);
    return `https://wa.me/${this.baseNumber}?text=${encodedMessage}`;
  }
  getUrlFromMessage(message: string, receiver: string): string {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${receiver}?text=${encodedMessage}`;
  }
}
