import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class XploraNotificationsService {

  constructor(private http: HttpClient) { }

  flightBookingConfirmation(to:string, data:any, attachments:any[]){
    return this.http.post("https://3tzccq0efd.execute-api.us-east-2.amazonaws.com/default/confirmationEmailSender",{to,data,attachments});
  }
}
