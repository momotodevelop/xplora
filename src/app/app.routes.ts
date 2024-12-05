// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FlightSearchComponent } from './pages/flight-search/flight-search.component';
import { BookingProcessComponent } from './pages/booking-process/booking-process.component';
import { LoginComponent } from './pages/login/login.component';
import { TravelerComponent } from './pages/panel/traveler/traveler.component';
import { TravelerHomeComponent } from './pages/panel/traveler/home/traveler-home.component';
import { fireGuard } from './fire-guard.guard';
import { ConfirmationComponent } from './pages/booking-process/confirmation/confirmation.component';
import { MakePaymentComponent } from './pages/make-payment/make-payment.component';
import { AboutComponent } from './pages/about/about.component';

export const routes: Routes = [
    { path: 'inicio', loadChildren: () => import('./pages/home/home.module').then(m => m.HomeModule) },
    { path: 'entrar', component: LoginComponent, data: { headerType:"dark" } },
    { path: 'nosotros', component: AboutComponent, data: { headerType:"dark" } },
    { path: 'resultados', children: [
      {path: 'vuelos/:origin/:destination/:departure/:return/:adults/:childrens/:infants/:flightClass', component: FlightSearchComponent, data: {headerType:"dark"}}
    ] },
    { path: 'reservar', children: [
      {path: 'vuelos/:bookingID', component: BookingProcessComponent, data: {headerType:"dark"}},
      {path: 'realizar-pago/:bookingID/:amount', component: MakePaymentComponent, data: {headerType:"dark"}}
    ] },
    { path: 'confirmacion', children: [
      {path: 'vuelos/:bookingID', component: ConfirmationComponent, data: {headerType:"dark"}}
    ]},
    { path: '', redirectTo: '/inicio', pathMatch: 'full' },
    { path: 'mi-cuenta', component: TravelerComponent, data: { headerType:"dark", dashboard: true }, 
    children: [
      { path: 'inicio', component: TravelerHomeComponent }
    ],canActivate:[fireGuard]}
  // otras rutas
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
