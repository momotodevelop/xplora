import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, mergeMap, retry, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AmadeusAuthService } from './amadeus-auth.service';
import { AmadeusActivity, AmadeusActivityResponse, AmadeusToursResponse } from '../types/amadeus-tours-response.types';

export interface ActivityDiscountedPriceOptions {
  multiplier: number;
  currency: 'MXN' | string;
  minimumAplicablePrice?: number;
}

export interface ActivityOriginalPriceOptions {
  multiplier: number;
  currency: 'MXN' | string;
}

@Injectable({
  providedIn: 'root'
})
export class AmadeusToursService {
  constructor(private http: HttpClient, private authService: AmadeusAuthService) {}

  getActivities(
    latitude: number,
    longitude: number,
    radius: number = 1,
    discountedPriceOptions?: ActivityDiscountedPriceOptions,
    originalPriceOptions?: ActivityOriginalPriceOptions
  ) {
    return this.authService.getToken().pipe(
      mergeMap((token: string | null) => {
        if (token === null) {
          return throwError(() => new Error('Token no disponible'));
        }
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
        return this.http
          .get<AmadeusToursResponse>(`${environment.amadeusApiUrl}/v1/shopping/activities`, {
            headers,
            params: {
              longitude: longitude.toString(),
              latitude: latitude.toString(),
              radius: radius.toString()
            }
          })
          .pipe(
            retry(10),
            map((response) =>
              this.applyPriceMultiplier(response, discountedPriceOptions, originalPriceOptions)
            )
          );
      })
    );
  }

  getActivityDetails(
    activityId: string,
    discountedPriceOptions?: ActivityDiscountedPriceOptions,
    originalPriceOptions?: ActivityOriginalPriceOptions
  ) {
    return this.authService.getToken().pipe(
      mergeMap((token: string | null) => {
        if (token === null) {
          return throwError(() => new Error('Token no disponible'));
        }
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
        return this.http
          .get<AmadeusActivityResponse>(`${environment.amadeusApiUrl}/v1/shopping/activities/${activityId}`, {
            headers
          })
          .pipe(
            retry(10),
            map((response) => ({
              ...response,
              data: this.applyPriceMultiplierToActivity(
                response.data,
                discountedPriceOptions,
                originalPriceOptions
              )
            }))
          );
      })
    );
  }

  private applyPriceMultiplier(
    response: AmadeusToursResponse,
    discountedPriceOptions?: ActivityDiscountedPriceOptions,
    originalPriceOptions?: ActivityOriginalPriceOptions
  ): AmadeusToursResponse {
    if (!discountedPriceOptions && !originalPriceOptions) {
      return response;
    }
    return {
      ...response,
      data: response.data.map((activity) =>
        this.applyPriceMultiplierToActivity(activity, discountedPriceOptions, originalPriceOptions)
      )
    };
  }

  private applyPriceMultiplierToActivity(
    activity: AmadeusActivity,
    discountedPriceOptions?: ActivityDiscountedPriceOptions,
    originalPriceOptions?: ActivityOriginalPriceOptions
  ): AmadeusActivity {
    if (!discountedPriceOptions && !originalPriceOptions) {
      return activity;
    }

    if (!activity.price?.amount) {
      return activity;
    }

    const parsedAmount = Number.parseFloat(activity.price.amount);
    if (!Number.isFinite(parsedAmount)) {
      return activity;
    }

    const discountedMultiplier = discountedPriceOptions?.multiplier;
    const originalPriceMultiplier = originalPriceOptions?.multiplier;
    const baseOriginalPrice =
      originalPriceOptions && Number.isFinite(originalPriceMultiplier)
        ? {
            ...activity.price,
            amount: (parsedAmount * (originalPriceMultiplier ?? 1)).toFixed(2),
            currencyCode: originalPriceOptions.currency
          }
        : undefined;
    const meetsMinimum =
      discountedPriceOptions?.minimumAplicablePrice === undefined ||
      parsedAmount >= discountedPriceOptions.minimumAplicablePrice;
    const shouldApplyDiscount =
      discountedPriceOptions &&
      Number.isFinite(discountedMultiplier) &&
      meetsMinimum;
    const adjustedPrice = shouldApplyDiscount
      ? {
          ...activity.price,
          amount: (parsedAmount * (discountedMultiplier ?? 1)).toFixed(2),
          currencyCode: discountedPriceOptions.currency
        }
      : baseOriginalPrice ?? activity.price;
    const originalPrice = shouldApplyDiscount ? baseOriginalPrice : undefined;

    return {
      ...activity,
      price: adjustedPrice,
      ...(originalPrice ? { originalPrice } : {})
    };
  }
}
