import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailVariable {
  email: string;
  substitutions: Array<{ 
    var: string; 
    value: string; 
  }>;
}

export interface EmailPersonalization {
  email: string;
  data: { [key: string]: any };
}

export interface EmailPayload {
  to: EmailRecipient[];
  from: EmailRecipient;
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  html?: string;
  text?: string;
  template_id?: string;
  variables?: EmailVariable[];
  personalization?: EmailPersonalization[];
  tags?: string[];
  reply_to?: EmailRecipient;
  send_at?: number; // Unix timestamp
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private firestore: Firestore) { }

  /**
   * Inserta un documento en la colección 'emails' que activa el trigger para el envío del correo.
   *
   * @param emailData Objeto con la configuración del correo (según el EmailPayload)
   * @returns Una promesa que se resuelve con la referencia del documento creado.
   */
  sendEmail(emailData: EmailPayload): Promise<any> {
    // Se obtiene la colección 'emails' de Firestore
    const emailsCollection = collection(this.firestore, 'emails');
    // Se agrega el documento con los datos del correo
    return addDoc(emailsCollection, emailData);
  }
}
