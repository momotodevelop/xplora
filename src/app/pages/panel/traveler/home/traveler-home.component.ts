import { Component, OnInit } from '@angular/core';
import { SharedDataService } from '../../../../services/shared-data.service';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { faPlaneTail, faTicketPerforated, faBed, faCar, faCab, faBoxHeart } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { XplorersPointsApiService } from '../../../../services/xplorers-points-api.service';
export interface UpcomingTrips{
  type:"FLIGHT"|"HOTEL"|"PACKAGE"|"TOUR"|"TRANSFER"|"CARRENTAL",
  destination: string,
  date: Date
}

@Component({
  selector: 'app-traveler-home',
  standalone: true,
  imports: [CommonModule, NgbDropdownModule, FontAwesomeModule],
  templateUrl: './traveler-home.component.html',
  styleUrl: './traveler-home.component.scss'
})
export class TravelerHomeComponent implements OnInit {
  planeIcon=faPlaneTail;
  hotelIcon=faBed;
  carIcon=faCar;
  transferIcon=faCab;
  tourIcon=faTicketPerforated;
  packageIcon=faBoxHeart;
  xpsBalance:number=0;
  upcomingTrips:UpcomingTrips[]=[
    {type: "FLIGHT", destination: "Cancún, México", date: new Date()},
    {type: "HOTEL", destination: "Riu Dunamar", date: new Date()},
    {type: "TOUR", destination: "Xcaret - Entrada Plus", date: new Date()},
    {type: "TRANSFER", destination: "Barcelo Riviera Maya", date: new Date()},
    {type: "PACKAGE", destination: "Grand Oasis Cancún", date: new Date()},
    {type: "CARRENTAL", destination: "Hertz Apto Cancún", date: new Date()}

  ]
  constructor (public sharedService:SharedDataService, private xplorersPoints:XplorersPointsApiService){}

  ngOnInit(): void {
    this.xplorersPoints.getBalance("user123").subscribe({
      next: (response=>{
        this.xpsBalance=response.balance;
      }),
      error: (err=>{
        console.log(err);
      })
    })
  }
} 
