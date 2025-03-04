import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom, Observable } from 'rxjs';

export interface CountryData {
  flags: {
    png: string;
    svg: string;
    alt: string;
  };
  idd: {
    root: string;
    suffixes: string[];
  };
  translations: {
    [key: string]: {
      official: string;
      common: string;
    };
  };
  cca2:string;
}

export interface CountryDataDisplay{ 
  flag: string; 
  callingCode: string; 
  translations: { [key: string]: { official: string; common: string } },
  code: string;
}

@Injectable({
  providedIn: 'root'
})
export class RestcountriesService {

  constructor(private http:HttpClient) { }
  private getCountriesJson():Observable<any>{
    return this.http.get<JSON>('../assets/js/restcountries.json');
  }
  async getCountries(){
    const json = await lastValueFrom(this.getCountriesJson());
    const countriesData:CountryData[] = json;
    return countriesData;
  }
  simplifyCountryData(country: CountryData): CountryDataDisplay {
    return {
      flag: country.flags.svg || country.flags.png, // Usa SVG si está disponible, si no usa PNG
      callingCode: country.idd.root + (country.idd.suffixes.length ? country.idd.suffixes[0] : ""), // Concatena root con el primer sufijo si existe
      translations: country.translations, // Mantiene las traducciones tal cual
      code: country.cca2 // Usa el código de dos letras del país
    };
  }
}
