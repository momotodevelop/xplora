import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { retry } from 'rxjs';
export interface Brand {
  brandId: string;
  claimed: boolean;
  domain: string;
  name: string;
  icon: string;
  _score: number;
  qualityScore: number;
  verified?: boolean; // Campo opcional, ya que no siempre está presente
}

@Injectable({
  providedIn: 'root'
})
export class BrandfetchService {

  constructor(private http: HttpClient) { }
  getBrands(brandname:string){
    const url = `https://api.brandfetch.io/v2/search/${brandname}?c=1idTGxvQMyVEDQOO1Up`;
    return this.http.get<Brand[]>(url).pipe(retry(10));
  }
}
