import { Component, OnInit } from '@angular/core';
import { SharedDataService } from '../../../../services/shared-data.service';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { faPlane, faBed, faCar, faCab, faBoxOpen, faTicket, faWarning, faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { XplorersPointsService } from '../../../../services/xplorers-points.service';
import { FireAuthService } from '../../../../services/fire-auth.service';
import { User } from '@angular/fire/auth';
import { FireBookingService } from '../../../../services/fire-booking.service';
import { Timestamp } from 'firebase/firestore';
import { BookingStatus, BookingTypes } from '../../../../types/booking.types';
import { TravelerFooterComponent } from '../traveler-footer/traveler-footer.component';
import { MetaHandlerService } from '../../../../services/meta-handler.service';

export interface UpcomingTrips{
  type: BookingTypes,
  destination: string,
  date: Date,
  status: BookingStatus,
  total:number
}

@Component({
    selector: 'app-traveler-home',
    imports: [CommonModule, NgbDropdownModule, FontAwesomeModule, TravelerFooterComponent],
    templateUrl: './traveler-home.component.html',
    styleUrl: './traveler-home.component.scss'
})
export class TravelerHomeComponent implements OnInit {
  planeIcon=faPlane;
  hotelIcon=faBed;
  carIcon=faCar;
  transferIcon=faCab;
  tourIcon=faTicket;
  packageIcon=faBoxOpen;
  pendingIcon=faWarning;
  confirmedIcon=faCheck;
  xpsBalance:number=0;
  pendingPayments:number=0;
  user?:User;
  upcomingTrips:UpcomingTrips[]=[]
  constructor (
    public sharedService:SharedDataService,
    private xPoints: XplorersPointsService,
    private auth: FireAuthService,
    private bookings: FireBookingService,
    private meta: MetaHandlerService
  ){}

  ngOnInit(): void {
    this.meta.setMeta({
      title: 'Xplora Travel || Mi Cuenta || Inicio',
      description: 'Consulta tu saldo de Xplorers Points, próximos viajes y resumen de tu cuenta en Xplora Travel.',
      image: '/assets/img/banner-generico.jpg'
    });
    this.auth.user.subscribe(user=>{
      if(user){
        this.user = user;
        this.xPoints.getUserPoints(user.uid).then(balance=>{
          this.xpsBalance = balance;
        }); 
        this.bookings.getBookingsByUser(user.uid).subscribe(bookings=>{
          this.upcomingTrips = bookings.map(booking=>{
            let type: UpcomingTrips["type"] = booking.type;
            let destination: string = "No Definido";
            let date: Date;
            let total = booking.payment?.totalDue || 0;
            let status: BookingStatus = booking.status || "PENDING"; // Default to Pending if status is not set
            if (booking.type === "FLIGHT") {
              destination = booking.flightDetails?.flights.outbound?.offer.itineraries[0].segments[0].arrival.iataCode || "Desconocido";
              date = new Date(booking.flightDetails?.flights.outbound?.offer.itineraries[0].segments[0].departure.at || Date.now());
            } else if (booking.type === "HOTEL") {
              destination = booking.hotelDetails?.hotel?.name || "Desconocido";
              date = new Date((booking.hotelDetails?.checkin as Timestamp)?.toMillis() || Date.now());
            }
            return { type:type, destination: destination!, date: date!, status, total };
          });
        });
        this.bookings.getPendingPaymentsTotalByUser(user.uid).subscribe(total=>{
          this.pendingPayments = total;
        });
      }
    })
  }
} 
