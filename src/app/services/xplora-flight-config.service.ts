import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export type DuffelEnvironment = 'test' | 'production';

export interface FlightPricingConfig {
  environment: DuffelEnvironment;
  usdExchangeRate: number;
  modifiers: {
    flightsPercent: number;
    ancillariesPercent: number;
    seatsPercent: number;
  };
}

export interface FlightAdminConfig extends FlightPricingConfig {
  secrets: {
    productionConfigured: boolean;
    testConfigured: boolean;
  };
}

export interface DuffelConnectionStatus {
  connected: boolean;
  environment: DuffelEnvironment;
  checkedAt: string;
}

interface FlightAdminConfigResponse {
  data: FlightAdminConfig;
}

interface SaveDuffelConnectionConfigInput {
  section: 'connection';
  config: Pick<FlightPricingConfig, 'environment'>;
  productionToken?: string;
  testToken?: string;
}

interface SaveFlightPricingConfigInput {
  section: 'pricing';
  config: Pick<FlightPricingConfig, 'usdExchangeRate' | 'modifiers'>;
}

export type SaveFlightAdminConfigInput =
  | SaveDuffelConnectionConfigInput
  | SaveFlightPricingConfigInput;

@Injectable({
  providedIn: 'root'
})
export class XploraFlightConfigService {
  private readonly endpoint = `${environment.duffelApiUrl}?resource=admin_config`;
  private readonly connectionEndpoint = `${environment.duffelApiUrl}?resource=admin_connection`;

  constructor(
    private auth: Auth,
    private http: HttpClient
  ) {}

  async getAdminConfig(): Promise<FlightAdminConfig> {
    const headers = await this.getAdminHeaders();
    const response = await firstValueFrom(
      this.http.get<FlightAdminConfigResponse>(this.endpoint, { headers })
    );
    return response.data;
  }

  async saveAdminConfig(input: SaveFlightAdminConfigInput): Promise<FlightAdminConfig> {
    const headers = await this.getAdminHeaders();
    const response = await firstValueFrom(
      this.http.post<FlightAdminConfigResponse>(this.endpoint, input, { headers })
    );
    return response.data;
  }

  async verifyConnection(): Promise<DuffelConnectionStatus> {
    const headers = await this.getAdminHeaders();
    const response = await firstValueFrom(
      this.http.get<{ data: DuffelConnectionStatus }>(this.connectionEndpoint, { headers })
    );
    return response.data;
  }

  private async getAdminHeaders(): Promise<HttpHeaders> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('AUTH_REQUIRED');
    }
    // Force a refresh so newly provisioned admin claims are honored
    // immediately by the protected Secret Manager endpoint.
    const token = await user.getIdToken(true);
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }
}
