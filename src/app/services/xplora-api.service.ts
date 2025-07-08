import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UpdateResponse, XploraFlightBooking } from '../types/xplora-api.types';

@Injectable({
  providedIn: 'root'
})
export class XploraApiService {

  constructor(private http: HttpClient) { }
  createBooking(data:XploraFlightBooking):Observable<{status:"CREATED", id: string}>{
    return this.http.put<{status:"CREATED", id: string}>("https://zuddyksquc.execute-api.us-east-2.amazonaws.com/default/xploraFlightsAPI", JSON.stringify(data));
  }
  getBooking(bookingID:string){
    return this.http.get<XploraFlightBooking>("https://zuddyksquc.execute-api.us-east-2.amazonaws.com/default/xploraFlightsAPI", { params: {bookingID}});
  }
  updateBooking(bookingID:string, updateData:any){
    //console.log("Send to API");
    return this.http.post<UpdateResponse>("https://zuddyksquc.execute-api.us-east-2.amazonaws.com/default/xploraFlightsAPI", {bookingID, updateData});
  }
}
