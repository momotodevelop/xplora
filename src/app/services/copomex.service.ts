import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { copomexToken } from '../../environments/environment';
export interface CodigoPostalInfo {
  error: boolean;
  code_error: number;
  error_message: string | null;
  response: {
    cp: string;
    asentamiento: string[];
    tipo_asentamiento: string;
    municipio: string;
    estado: string;
    ciudad: string;
    pais: string;
  } | null;
}

@Injectable({
  providedIn: 'root'
})
export class CopomexService {
  private readonly baseUrl = 'https://api.copomex.com/query';
  constructor(private http: HttpClient) { }

  /**
   * Obtiene información sobre un código postal.
   * @param codigoPostal El código postal de 5 dígitos.
   * @param simplified Si es true, se agrupa y devuelve versión “simplified”.
   */
  getInfoCodigoPostal(codigoPostal: string): Observable<CodigoPostalInfo> {
    const url = `${this.baseUrl}/info_cp/${codigoPostal}`;
    let params = new HttpParams()
      .set('token', copomexToken)
      .set('type', 'simplified');

    return this.http.get<CodigoPostalInfo>(url, { params });
  }
}
