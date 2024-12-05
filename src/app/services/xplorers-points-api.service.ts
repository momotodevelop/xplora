import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
const TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJYcGxvcmEgV2ViIiwiaWF0IjoxNzIxMDAwOTEzLCJleHAiOjE3NTI1MzY5MTUsImF1ZCI6Ind3dy54cGxvcmF0cmF2ZWwuY29tLm14Iiwic3ViIjoicmVzZXJ2YWNpb25lc0B4cGxvcmF0cmF2ZWwuY29tLm14In0.QdN_WLzQ7-cl9gI2jY8v55A5Y8CE0k9L4cZS7DCmQCc";
@Injectable({
  providedIn: 'root'
})
export class XplorersPointsApiService {

  constructor(private http: HttpClient) { }
  getBalance(uid:string){
    return this.http.get<{balance:number}>("https://f7dy2hbwpa.execute-api.us-east-2.amazonaws.com/v1/balance/user", { params: {userID : uid}, headers: new HttpHeaders({'Authorization': TOKEN}) });
  }
}
