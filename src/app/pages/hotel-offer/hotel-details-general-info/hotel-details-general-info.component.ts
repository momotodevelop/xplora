import { Component, Input, OnInit } from '@angular/core';
import { Facility, FacilityDescription, HotelDetails } from '../../../types/lite-api.types';
import { GoogleTranslationService } from '../../../services/google-translation.service';
import { faCircle, faWifi } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule, IconDefinition } from '@fortawesome/angular-fontawesome';
import { FACILITIES_ICONS } from '../../../static/amenities-lite.static'
import { LiteApiService } from '../../../services/lite-api.service';
import { faCheckCircle } from '@fortawesome/free-regular-svg-icons';
import { BehaviorSubject, catchError, Observable, of, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { VisitCounterService } from '../../../services/visit-counter.service';

@Component({
  selector: 'app-hotel-details-general-info',
  imports: [FontAwesomeModule, CommonModule],
  templateUrl: './hotel-details-general-info.component.html',
  styleUrl: './hotel-details-general-info.component.scss'
})
export class HotelDetailsGeneralInfoComponent implements OnInit {
  @Input() details!:HotelDetails;
  description:string='';
  wifi=faWifi;
  circleIcon=faCircle;
  facilitiesDictionarie?:FacilityDescription[];
  visits:number=0;
  viewers:number=0;
  showAllFacilities:boolean = false;
  constructor(private translate: GoogleTranslationService, private lite: LiteApiService, private googleTranslate:GoogleTranslationService, private visitCounter:VisitCounterService){}
  ngOnInit(): void {
    this.description = this.details.hotelDescription;
    this.translate.translateV2(this.details.hotelDescription, 'es').subscribe({
      next: (ok) =>{
        this.description = ok.data.translations[0].translatedText;
      },
      error: (err) => {
        //console.log(err);
        this.description = this.details.hotelDescription;
      }
    });
    //console.log(this.details.facilities[0].facilityId);
    this.lite.facilitiesData.subscribe(facilities=>{
      this.facilitiesDictionarie = facilities.data;
      //console.log(this.facilitiesDictionarie);
    });
    this.visits = this.visitCounter.getVisitCount(this.details.id);
    this.viewers = this.getRandomNumber();
  }
  getFacilityIcon(id:number):IconDefinition{
    const facilityIcon = FACILITIES_ICONS.find(facilitie=> facilitie.facility_id===id);
    return facilityIcon ? facilityIcon.icon : faCheckCircle;
  }
  getFacilityDescription(facility:Facility){
    if(!this.facilitiesDictionarie) {
      //console.log("No dictionarie");
      return undefined;
    };
    const description = this.facilitiesDictionarie.find(fac=>fac.facility_id===facility.facilityId);
    if(!description) {
      //console.log("No Description ID: "+facility.facilityId);
      return undefined;
    };
    return description;
  }
  private facilityCache = new Map<number, BehaviorSubject<string>>(); // Cache de traducciones
  getFacilityText(facility: Facility): Observable<string> {
    if (this.facilityCache.has(facility.facilityId)) {
      return this.facilityCache.get(facility.facilityId)!.asObservable(); // Si ya se está traduciendo, devolver observable
    }

    const facilityText$ = new BehaviorSubject<string>(facility.name);
    this.facilityCache.set(facility.facilityId, facilityText$); // Guardamos en el cache

    if (!this.facilitiesDictionarie) {
      //console.log("No dictionary available");
    } else {
      const description = this.facilitiesDictionarie.find(fac => fac.facility_id === facility.facilityId);

      if (description) {
        const translation = description.translation.find(tr => tr.lang === "es");
        if (translation) {
          facilityText$.next(translation.facility); // Si hay traducción en el diccionario, la usamos
          return facilityText$.asObservable();
        }
        //console.log(`No Translation found for ID: ${facility.facilityId}`);
      } else {
        //console.log(`No Description found for ID: ${facility.facilityId}`);
      }
    }

    // Si no hay descripción o traducción, intentamos traducir con Google Translate (solo una vez)
    this.googleTranslate.translateV2(facility.name, 'es').pipe(
      switchMap(response => {
        const translatedText = response?.data?.translations?.[0]?.translatedText || facility.name;
        return of(translatedText);
      }),
      catchError(error => {
        console.error(`Translation failed for ID ${facility.facilityId}:`, error);
        return of(facility.name); // En caso de error, usamos el nombre original
      })
    ).subscribe(translatedText => {
      facilityText$.next(translatedText);
    });

    return facilityText$.asObservable();
  }
  getRandomNumber(): number {
    return Math.floor(Math.random() * (14 - 9 + 1)) + 9;
  }
}
