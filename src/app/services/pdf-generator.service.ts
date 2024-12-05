import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, retry } from 'rxjs';

export interface PdfResponse {
  response: string;
  meta: {
      name: string;
      display_name: string;
      encoding: string;
      'content-type': string;
  };
}


@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {

  constructor(private http: HttpClient) { }

  private getToken():Observable<string>{
    return this.http.get<string>("https://phphpgvd28.execute-api.us-east-2.amazonaws.com/default/pdfgeneratorJWT");
  }
  private createDocument(templateId: string, data: any, token:string){
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post<PdfResponse>("https://us1.pdfgeneratorapi.com/api/v4/documents/generate", {
      template: {
        id: templateId,
        data
      },
      format: "pdf",
      output: "base64",
      name: data.pnr
    }, {headers});
  }

  getPDFDocumentData(templateId: string, data: any):Promise<{data:string, name: string}>{
    return new Promise((resolve, reject)=>{
      this.getToken().pipe(retry(5)).subscribe({
        next: (token)=>{
          this.createDocument(templateId, data, token).pipe(retry(3)).subscribe({
            next: (createdDocument) => {
              resolve({
                data: createdDocument.response,
                name: createdDocument.meta.name
              })
            },
            error: (err) => {
              reject(err)
            }
          })
        },
        error: (err)=>{
          reject(err)
        }
      })
    })
  }
}
