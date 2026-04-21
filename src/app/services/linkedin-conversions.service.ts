import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, EMPTY, Observable } from 'rxjs';
import { firebaseConfig, environment } from '../../environments/environment';

interface LinkedInTrackResponse {
  status: 'already_sent' | 'sent';
  conversionKey: string;
  eventId: string;
}

interface LinkedInBookingConversionRequest {
  amount: number;
  bookingId: string;
  conversionKey: string;
  currencyCode?: string;
  email?: string;
  eventId?: string;
  firstName?: string;
  lastName?: string;
  occurredAt?: number;
}

const LI_FAT_ID_STORAGE_KEY = 'linkedin_li_fat_id';
const LI_FAT_ID_EXPIRATION_KEY = 'linkedin_li_fat_id_expires_at';
const LI_FAT_ID_TTL_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable({
  providedIn: 'root'
})
export class LinkedInConversionsService {
  private readonly isBrowser: boolean;
  private readonly fallbackEndpoint =
    `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/trackLinkedInConversion`;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  initialize(): void {
    if (!this.isEnabled() || !this.isBrowser) {
      return;
    }

    this.clearExpiredClickId();
    const clickIdFromUrl = this.readClickIdFromUrl();
    const clickIdFromCookie = this.readCookie('li_fat_id');
    const clickId = clickIdFromUrl ?? clickIdFromCookie;

    if (clickId) {
      this.persistClickId(clickId);
    }
  }

  trackFlightBookingPending(request: Omit<LinkedInBookingConversionRequest, 'conversionKey'>): Observable<LinkedInTrackResponse> {
    return this.trackBookingConversion({
      ...request,
      conversionKey: environment.linkedIn.conversionKeys.flightBookingPending
    });
  }

  trackHotelBookingPending(request: Omit<LinkedInBookingConversionRequest, 'conversionKey'>): Observable<LinkedInTrackResponse> {
    return this.trackBookingConversion({
      ...request,
      conversionKey: environment.linkedIn.conversionKeys.hotelBookingPending
    });
  }

  private trackBookingConversion(request: LinkedInBookingConversionRequest): Observable<LinkedInTrackResponse> {
    if (!this.isEnabled() || !this.isBrowser) {
      return EMPTY as Observable<LinkedInTrackResponse>;
    }

    const endpoint = this.getTrackingEndpoint();
    const liFatId = this.getStoredClickId();

    return this.http.post<LinkedInTrackResponse>(endpoint, {
      bookingId: request.bookingId,
      conversionHappenedAt: request.occurredAt ?? Date.now(),
      conversionKey: request.conversionKey,
      eventId: request.eventId ?? `${request.conversionKey}:${request.bookingId}`,
      user: {
        email: request.email,
        firstName: request.firstName,
        lastName: request.lastName,
        liFatId
      },
      value: {
        amount: request.amount,
        currencyCode: request.currencyCode ?? 'MXN'
      }
    }).pipe(
      catchError((error) => {
        console.error('LinkedIn conversion tracking failed', error);
        return EMPTY;
      })
    );
  }

  private isEnabled(): boolean {
    return environment.linkedIn.enabled === true;
  }

  private getTrackingEndpoint(): string {
    return environment.linkedIn.trackingEndpoint.trim() || this.fallbackEndpoint;
  }

  private readClickIdFromUrl(): string | undefined {
    if (!this.isBrowser) {
      return undefined;
    }

    const url = new URL(window.location.href);
    return this.normalizeClickId(url.searchParams.get('li_fat_id'));
  }

  private getStoredClickId(): string | undefined {
    if (!this.isBrowser) {
      return undefined;
    }

    this.clearExpiredClickId();
    return this.normalizeClickId(localStorage.getItem(LI_FAT_ID_STORAGE_KEY));
  }

  private persistClickId(clickId: string): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem(LI_FAT_ID_STORAGE_KEY, clickId);
    localStorage.setItem(
      LI_FAT_ID_EXPIRATION_KEY,
      String(Date.now() + LI_FAT_ID_TTL_MS)
    );
  }

  private clearExpiredClickId(): void {
    if (!this.isBrowser) {
      return;
    }

    const expiresAt = Number(localStorage.getItem(LI_FAT_ID_EXPIRATION_KEY) ?? '0');
    if (Number.isFinite(expiresAt) && expiresAt > Date.now()) {
      return;
    }

    localStorage.removeItem(LI_FAT_ID_STORAGE_KEY);
    localStorage.removeItem(LI_FAT_ID_EXPIRATION_KEY);
  }

  private readCookie(name: string): string | undefined {
    if (!this.isBrowser) {
      return undefined;
    }

    const escapedName = name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1');
    const matches = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
    return this.normalizeClickId(matches ? decodeURIComponent(matches[1]) : undefined);
  }

  private normalizeClickId(value: string | null | undefined): string | undefined {
    const normalized = String(value ?? '').trim();
    return normalized || undefined;
  }
}
