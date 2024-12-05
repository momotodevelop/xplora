import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {

  constructor(private http: HttpClient) { }

  uploadConfirmation(folder:string, name:string, data:string){
    return this.http.post<string>("https://2ogsadlt16.execute-api.us-east-2.amazonaws.com/default/fileUploader", {
      folder,
      name,
      data
    });
  }
}
