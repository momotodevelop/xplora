// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FlightSearchComponent } from './pages/flight-search/flight-search.component';
import { BookingProcessComponent } from './pages/booking-process/booking-process.component';
import { TravelerComponent } from './pages/panel/traveler/traveler.component';
import { TravelerHomeComponent } from './pages/panel/traveler/home/traveler-home.component';
import { fireGuard } from './fire-guard.guard';
import { MakePaymentComponent } from './pages/make-payment/make-payment.component';
import { AboutComponent } from './pages/about/about.component';
import { ConfianzaComponent } from './pages/confianza/confianza.component';
import { HotelSearchComponent } from './pages/hotel-search/hotel-search.component';
import { HotelOfferComponent } from './pages/hotel-offer/hotel-offer.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { roleGuard } from './guards/role.guard';
import { loginGuard } from './guards/login.guard';
import { HotelBookingComponent } from './pages/hotel-booking/hotel-booking.component';
import { BlogListComponent } from './pages/blog-list/blog-list.component';
import { BlogSingleComponent } from './pages/blog-single/blog-single.component';
import { TermsComponent } from './pages/terms/terms.component';
import { PrivacyComponent } from './pages/privacy/privacy.component';
import { XplorersLandingComponent } from './pages/xplorers-landing/xplorers-landing.component';
import { ContactComponent } from './pages/contact/contact.component';
import { CustomerSupportComponent } from './pages/customer-support/customer-support.component';
import { HomeComponent } from './pages/home/home.component';
import { BookingPublicConfirmationComponent } from './pages/booking-public-confirmation/booking-public-confirmation.component';
import { XploraiComponent } from './pages/xplorai/xplorai.component';
import { ActivitySearchComponent } from './pages/activity-search/activity-search.component';
import { ActivityDetailsComponent } from './pages/activity-details/activity-details.component';

export const routes: Routes = [
    { path: '', redirectTo: 'inicio', pathMatch: 'full' },
    { path: 'inicio', component: HomeComponent },
    { path: 'entrar', component: LoginPageComponent, data: { headerType:"dark" }, canActivate: [loginGuard] },
    { path: 'nosotros', component: AboutComponent, data: { headerType:"dark" } },
    { path: 'confianza', component: ConfianzaComponent, data: { headerType:"dark" } },
    { path: 'terminos-condiciones', component: TermsComponent, data: { headerType:"dark" } },
    { path: 'xplorers', component: XplorersLandingComponent, data: { headerType:"dark" } },
    { path: 'xplorai', component: XploraiComponent, data: { headerType:"dark" } },
    { path: 'actividades/detalle/:activityId', component: ActivityDetailsComponent, data: { headerType:"dark" } },
    { path: 'actividades/:location', component: ActivitySearchComponent, data: { headerType:"dark" } },
    { path: 'actividades', component: ActivitySearchComponent, data: { headerType:"dark" } },
    { path: 'contacto', component: ContactComponent, data: { headerType:"dark" } },
    { path: 'ayuda', component: CustomerSupportComponent, data: { headerType:"dark" } },
    { path: 'privacidad', component: PrivacyComponent },
    { path: 'blog', data: { headerType:"dark"}, children: [
      {path: '', component: BlogListComponent},
      {path: ':id', component: BlogSingleComponent}
    ]},
    { path: 'resultados', 
      children: [
        {path: 'vuelos',
          children: [
            {path: ':origin/:destination/:departure/:return/:adults/:childrens/:infants/:flightClass', component: FlightSearchComponent, data: {headerType:"dark"}}
          ]
        },
        {
          path: 'hoteles', 
          children: [
            {path: ':placeId/:rooms/:checkin/:checkout', component: HotelSearchComponent, data: {headerType:"dark"}},
            {path: 'detalles/:hotelId', component: HotelOfferComponent, data: {headerType:"dark"}}
          ]
        }
      ] 
    },
    { path: 'reservar', children: [
      {path: 'vuelos/:bookingID', component: BookingProcessComponent, data: {headerType:"dark"}},
      {path: 'realizar-pago/:bookingID', component: MakePaymentComponent, data: {headerType:"dark"}},
      { 
        path: "hoteles",
        data: {headerType:"dark"},
        children: [
          { 
            path: ':bookingID', component: HotelBookingComponent
          }
        ]
      },
    ] },
    { path: 'confirmacion', children: [
      {path: ':bookingID', component: BookingPublicConfirmationComponent, data: {headerType:"dark"}}
    ]},
    { path: '', redirectTo: '/inicio', pathMatch: 'full' },
    { 
      path: 'mi-cuenta', 
      component: TravelerComponent, 
      data: { 
        headerType:"dark", 
        dashboard: true, 
        roles: ['traveler', 'admin'] 
      }, 
      children: [
        { path: '', redirectTo: 'inicio', pathMatch: 'full' },
        { path: 'inicio', component: TravelerHomeComponent, title: 'Xplora Travel || Mi Cuenta || Inicio' },
        { path: 'reservaciones', loadComponent: () => import('../app/pages/panel/traveler/traveler-bookings/traveler-bookings.component').then(c => c.TravelerBookingsComponent), title: 'Xplora Travel || Mi Cuenta || Reservaciones' },
        { path: 'ajustes', 
          loadComponent: () => import('../app/pages/panel/traveler/traveler-settings/traveler-settings.component').then(c => c.TravelerSettingsComponent),
          children: [
            { path: 'contacto', loadComponent: () => import('../app/pages/panel/traveler/traveler-settings/contact-settings/contact-settings.component').then(c => c.ContactSettingsComponent), title: 'Xplora Travel || Mi Cuenta || Ajustes de Contacto' },
            { path: 'pasajeros', loadComponent: () => import('../app/pages/panel/traveler/traveler-settings/saved-passengers-settings/saved-passengers-settings.component').then(c => c.SavedPassengersSettingsComponent), title: 'Xplora Travel || Mi Cuenta || Ajustes de Pasajeros' },
            { path: 'perfil', loadComponent: () => import('../app/pages/panel/traveler/traveler-settings/traveler-profile-settings/traveler-profile-settings.component').then(c => c.TravelerProfileSettingsComponent), title: 'Xplora Travel || Mi Cuenta || Ajustes de Perfil' },
            { path: '', redirectTo: 'perfil', pathMatch: 'full' } // Redirige a perfil por defecto
          ]
        }
      ],
      title: 'Xplora Travel || Mi Cuenta',
      canActivate:[roleGuard]
    },
    {
      path: 'admin',
      canActivate: [roleGuard], 
      data: { 
        headerType:"dark", 
        dashboard: true, 
        roles: ['admin'] 
      },
      loadComponent: () => import('../app/pages/panel/admin/admin.component').then(c => c.AdminComponent),
      children: [
        { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        { path: 'dashboard', title: 'Prueba 2', loadComponent: () => import('../app/pages/panel/admin/admin-dashboard/admin-dashboard.component').then(c => c.AdminDashboardComponent) },
        { path: 'bookings', loadComponent: () => import('../app/pages/panel/admin/admin-bookings/admin-bookings.component').then(c => c.AdminBookingsComponent) },
        { path: 'lite-vouchers', loadComponent: () => import('../app/pages/panel/admin/admin-lite-vouchers/admin-lite-vouchers.component').then(c => c.AdminLiteVouchersComponent) },
        { path: 'promos', loadComponent: () => import('../app/pages/panel/admin/admin-promos/admin-promos.component').then(c => c.AdminPromosComponent) },
        { path: 'tours/nuevo', loadComponent: () => import('../app/pages/panel/admin/admin-tour-form/admin-tour-form.component').then(c => c.AdminTourFormComponent) },
        { path: 'tours/editar/:tourId', loadComponent: () => import('../app/pages/panel/admin/admin-tour-form/admin-tour-form.component').then(c => c.AdminTourFormComponent) },
        { path: 'tours', loadComponent: () => import('../app/pages/panel/admin/admin-tours/admin-tours.component').then(c => c.AdminToursComponent) },
        { path: 'booking/:bookingID', loadComponent: () => import('../app/pages/panel/admin/booking-details-admin/booking-details-admin.component').then(c => c.BookingDetailsAdminComponent) }
      ]
    }
  // otras rutas
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
