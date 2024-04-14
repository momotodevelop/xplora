// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FlightSearchComponent } from './pages/flight-search/flight-search.component';
import { BookingProcessComponent } from './pages/booking-process/booking-process.component';

export const routes: Routes = [
    { path: 'inicio', loadChildren: () => import('./pages/home/home.module').then(m => m.HomeModule) },
    { path: 'resultados', children: [
      {path: 'vuelos/:origin/:destination/:departure/:return/:adults/:childrens/:infants/:flightClass', component: FlightSearchComponent, data: {headerType:"dark"}}
    ] },
    { path: 'reservar', children: [
      {path: 'vuelos/:bookingID/:step', component: BookingProcessComponent, data: {headerType:"dark"}}
    ] },
    { path: '', redirectTo: '/inicio', pathMatch: 'full' },
  // otras rutas
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
