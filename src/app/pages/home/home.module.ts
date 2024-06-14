// src/app/pages/home/home.module.ts
import { NgModule } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { HomeComponent } from './home.component';
import { SearchComponent } from './search/search.component';
import { PopularDestinationsComponent } from './popular-destinations/popular-destinations.component';
import { BookingBenefitsComponent } from './booking-benefits/booking-benefits.component';
import { TestimonialsComponent } from './testimonials/testimonials.component';
import { InspirationComponent } from './inspiration/inspiration.component';
import { RecommendedDestinationsComponent } from './recommended-destinations/recommended-destinations.component';
import { NewsletterSubscriptionComponent } from './newsletter-subscription/newsletter-subscription.component';
import { HomeRoutingModule } from './home-routing.module';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { LocationSelectionSheetComponent } from '../../shared/location-selection-sheet/location-selection-sheet.component';
import { PaxSelectionSheetComponent } from '../../shared/pax-selection-sheet/pax-selection-sheet.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlightDateSelectionSheetComponent } from '../../shared/flight-date-selection-sheet/flight-date-selection-sheet.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AirportSearchService } from '../../services/airport-search.service';
import { AmadeusAuthService } from '../../services/amadeus-auth.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@NgModule({ declarations: [
        HomeComponent,
        SearchComponent,
        PopularDestinationsComponent,
        BookingBenefitsComponent,
        TestimonialsComponent,
        InspirationComponent,
        RecommendedDestinationsComponent,
        NewsletterSubscriptionComponent
    ],
    exports: [
        TitleCasePipe
    ], imports: [CommonModule,
        HomeRoutingModule,
        HttpClientModule,
        LocationSelectionSheetComponent,
        PaxSelectionSheetComponent,
        FlightDateSelectionSheetComponent,
        MatBottomSheetModule,
        MatButtonModule,
        ReactiveFormsModule,
        TitleCasePipe,
        FormsModule,
        ReactiveFormsModule,
        MatSnackBarModule], providers: [
        TitleCasePipe,
        DatePipe,
        AirportSearchService,
        AmadeusAuthService,
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class HomeModule { }
