import { Injectable } from '@angular/core';
import { createClient, ClientConfig } from '@sanity/client';
import { NavigationData } from '../types/sanity.types';
const config: ClientConfig = {
  projectId: 'h1vyk8k7',
  dataset: 'production',
  useCdn: true, // set to `false` to bypass the edge cache
  apiVersion: '2024-06-09', // use current date (YYYY-MM-DD) to target the latest API version
}
const client = createClient(config);
@Injectable({
  providedIn: 'root'
})
export class SanityService {
  
  constructor() { }
  private getBySlug(type:"navigation"|"page", slug:string){
    return client.fetch<NavigationData[]>('(*)[_type=="'+type+'"&&slug.current=="'+slug+'"]')
  }
}
