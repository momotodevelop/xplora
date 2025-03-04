import { Component, OnInit } from '@angular/core';
import { SharedDataService } from '../../../../services/shared-data.service';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { faPlane, faBed, faCar, faCab, faBoxOpen, faTicket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { XplorersPointsService } from '../../../../services/xplorers-points.service';
import { FireAuthService } from '../../../../services/fire-auth.service';

export interface UpcomingTrips{
  type:"FLIGHT"|"HOTEL"|"PACKAGE"|"TOUR"|"TRANSFER"|"CARRENTAL",
  destination: string,
  date: Date
}

@Component({
    selector: 'app-traveler-home',
    imports: [CommonModule, NgbDropdownModule, FontAwesomeModule],
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
  xpsBalance:number=0;
  upcomingTrips:UpcomingTrips[]=[
    {type: "FLIGHT", destination: "Cancún, México", date: new Date()},
    {type: "HOTEL", destination: "Riu Dunamar", date: new Date()},
    {type: "TOUR", destination: "Xcaret - Entrada Plus", date: new Date()},
    {type: "TRANSFER", destination: "Barcelo Riviera Maya", date: new Date()},
    {type: "PACKAGE", destination: "Grand Oasis Cancún", date: new Date()},
    {type: "CARRENTAL", destination: "Hertz Apto Cancún", date: new Date()}

  ]
  constructor (
    public sharedService:SharedDataService,
    private xPoints: XplorersPointsService,
    private auth: FireAuthService
  ){}

  ngOnInit(): void {
    this.auth.user.subscribe(user=>{
      if(user){
        this.xPoints.getUserPoints(user.uid).then(balance=>{
          this.xpsBalance = balance;
        }); 
      }
    })
  }
} 
