import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  DuffelStaysAdminConfig,
  DuffelStaysConnectionStatus,
  DuffelStaysDestinationSuggestionsResponse,
  DuffelStaysPublicConfig,
  DuffelStaysSearchInput,
  DuffelStaysSearchResponse
} from '../types/duffel-stays.types';
import type { DuffelEnvironment } from './xplora-flight-config.service';

interface DataResponse<T> {
  data: T;
}

export interface SaveDuffelStaysAdminConfigInput {
  config: {
    enabled: boolean;
    environment: DuffelEnvironment;
  };
  productionToken?: string;
  testToken?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DuffelStaysService {
  constructor(
    private auth: Auth,
    private http: HttpClient
  ) {}

  async getPublicConfig(): Promise<DuffelStaysPublicConfig> {
    const response = await firstValueFrom(
      this.http.get<DataResponse<DuffelStaysPublicConfig>>(
        this.endpoint('stays_config')
      )
    );
    return response.data;
  }

  async search(input: DuffelStaysSearchInput): Promise<DuffelStaysSearchResponse> {
    return firstValueFrom(
      this.http.post<DuffelStaysSearchResponse>(
        this.endpoint('stays_search'),
        input
      )
    );
  }

  async suggestDestinations(
    query: string
  ): Promise<DuffelStaysDestinationSuggestionsResponse> {
    return firstValueFrom(
      this.http.post<DuffelStaysDestinationSuggestionsResponse>(
        this.endpoint('stays_destinations'),
        { query }
      )
    );
  }

  async getAdminConfig(): Promise<DuffelStaysAdminConfig> {
    const headers = await this.getAdminHeaders();
    const response = await firstValueFrom(
      this.http.get<DataResponse<DuffelStaysAdminConfig>>(
        this.endpoint('stays_admin_config'),
        { headers }
      )
    );
    return response.data;
  }

  async saveAdminConfig(
    input: SaveDuffelStaysAdminConfigInput
  ): Promise<DuffelStaysAdminConfig> {
    const headers = await this.getAdminHeaders();
    const response = await firstValueFrom(
      this.http.post<DataResponse<DuffelStaysAdminConfig>>(
        this.endpoint('stays_admin_config'),
        input,
        { headers }
      )
    );
    return response.data;
  }

  async verifyConnection(): Promise<DuffelStaysConnectionStatus> {
    const headers = await this.getAdminHeaders();
    const response = await firstValueFrom(
      this.http.get<DataResponse<DuffelStaysConnectionStatus>>(
        this.endpoint('stays_admin_connection'),
        { headers }
      )
    );
    return response.data;
  }

  private endpoint(resource: string): string {
    return `${environment.duffelApiUrl}?resource=${resource}`;
  }

  private async getAdminHeaders(): Promise<HttpHeaders> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('AUTH_REQUIRED');
    }
    const token = await user.getIdToken(true);
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }
}
