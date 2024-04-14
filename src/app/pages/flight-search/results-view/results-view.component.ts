import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnInit, ViewChild, input } from '@angular/core';
import { FlightOffersAmadeusService } from '../../../services/flight-offers-amadeus.service';
import { Dictionaries, FlightOffer } from '../../../types/flight-offer-amadeus.types';
import { CommonModule } from '@angular/common';
import { DateStringPipe } from '../../../date-string.pipe';
import { DurationPipe } from '../../../duration.pipe';
import { FlightClassType } from '../search-topbar/search-topbar.component';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { FlightOfferDetailsComponent } from '../../../shared/flight-offer-details/flight-offer-details.component';
import { PriceMutatorService } from '../../../services/price-mutator.service';
import { PaginatePipe } from '../../../paginate.pipe';
import { FlightOffersDataHandlerService } from '../../../services/flight-offers-data-handler.service';
import { FilterFlightsSheetComponent } from '../../../shared/filter-flights-sheet/filter-flights-sheet.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { first } from 'rxjs';
import { FlightOfferComponent } from '../flight-offer/flight-offer.component';
import { SharedDataService } from '../../../services/shared-data.service';

interface PaginationItem {
  pageNumber: number;
  active: boolean;
}

interface PaginatorData{
  visible: PaginationItem[],
  showSuspensive: boolean,
  hidden: PaginationItem[],
  last: PaginationItem,
  totalPages:number,
  actualPage:number,
  pageStatusString:string
}

@Component({
  selector: 'app-flight-search-results-view',
  standalone: true,
  imports: [CommonModule, DateStringPipe, DurationPipe, MatIconModule, MatChipsModule, MatTooltipModule, MatBottomSheetModule, PaginatePipe, MatSnackBarModule, NgxSkeletonLoaderModule, FlightOfferComponent],
  templateUrl: './results-view.component.html',
  styleUrl: './results-view.component.scss',
  animations: [
    trigger('listAnimation', [
      transition('* <=> *', [
        query(':enter',
          [style({ opacity: 0, transform: 'translateY(-15px)' }), stagger('100ms', animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0px)' })))],
          { optional: true }
        )
      ])
    ])
  ]
})
export class ResultsViewComponent implements OnInit {
  @Input() origin!:string;
  @Input() destination!:string;
  @Input() departure!:string;
  @Input() return:string|undefined;
  @Input() flightClass!:FlightClassType;
  @Input() round!:boolean;
  @ViewChild('scrollTarget') scrollTarget!: ElementRef;
  results:FlightOffer[] = [];
  dictionaries!:Dictionaries;
  hoveredIndex: number | null = null;
  paginator?:PaginatorData;
  loading:boolean=true;
  loaderArray:number[]=[]
  mobileView!: boolean;
  selectionStatus:"OUTBOUND"|"INBOUND"="OUTBOUND";
  constructor(
    private flightOffers: FlightOffersAmadeusService, 
    public flightOffersHandler: FlightOffersDataHandlerService,
    private bs:MatBottomSheet, 
    private priceMutator:PriceMutatorService,
    private toast: MatSnackBar,
    private cd : ChangeDetectorRef,
    private breakpointObserver: BreakpointObserver,
    private sharedData:SharedDataService){
      this.breakpointObserver.observe([
        "(max-width: 991px)"
      ]).subscribe((result: BreakpointState) => {
        console.log(result);
        this.mobileView=result.matches;
      });
      console.log(this.breakpointObserver.isMatched("(max-width: 991px)"));
    }

  @HostListener('window:resize', ['$event'])  
  onResize() {  
    this.flightOffersHandler.updatePageSize(this.mobileView?12:7);
  }

  ngOnInit(): void {
    this.flightOffersHandler.flightSelectionStatus.subscribe(status=>{
      this.loading=true;
      this.createItemsLoader(6);
      if(status!=="FULL"){
        this.selectionStatus=status;
        if(status==="OUTBOUND"){
          this.flightOffers.searchFlightOffers(this.origin, this.destination, this.departure, this.flightClass).pipe(first()).subscribe({
            next: (results)=>{
              const originalOffers:FlightOffer[]=JSON.parse(JSON.stringify(results.data));
              let resultsToBeMutated:FlightOffer[]=JSON.parse(JSON.stringify(results.data));
              if(results.data.length>0) {
                this.dictionaries = results.dictionaries;
                this.flightOffersHandler.setData(this.priceMutator.applyDiscount(resultsToBeMutated, 20), results.dictionaries,  this.mobileView?12:7, {}, ['duracion', 'asc']);
              }
              this.loading=false;
            },
            error: (err) => {
              console.error(err);
            }
          });
        }else if(status==="INBOUND"&&this.return){
          this.flightOffers.searchFlightOffers(this.destination, this.origin, this.return, this.flightClass).pipe(first()).subscribe({
            next: (results)=>{
              const originalOffers:FlightOffer[]=JSON.parse(JSON.stringify(results.data));
              let resultsToBeMutated:FlightOffer[]=JSON.parse(JSON.stringify(results.data));
              if(results.data.length>0) {
                this.dictionaries = results.dictionaries;
                this.flightOffersHandler.setData(this.priceMutator.applyDiscount(resultsToBeMutated, 20), results.dictionaries,  this.mobileView?12:7, {}, ['duracion', 'asc']);
              }
              this.loading=false;
            },
            error: (err) => {
              console.error(err);
            }
          });
        }
      }else{

      }
    });
    this.flightOffersHandler.selected.subscribe(flights=>{
      console.log(flights);
    });
    this.flightOffersHandler.filtered.subscribe(offers=>{
      this.results=offers;
      if(offers.length>0){
        this.paginator=this.createPaginators(offers.length, this.mobileView, 1);
      }
      console.log();
    });
    this.flightOffersHandler.page.subscribe(actualPage=>{
      setTimeout(() => {
        if(this.scrollTarget!==undefined){
          const element = this.scrollTarget.nativeElement;
          const position = element.getBoundingClientRect().top + (window.scrollY ?? window.pageYOffset) - 100;
          window.scrollTo({
            top: position,
            behavior: 'smooth'
          });
        }
      }, 100);
      this.paginator=this.createPaginators(this.results.length, this.mobileView, actualPage);
    });
    console.log(this.round);

  }

  createItemsLoader(items:number){
    this.loaderArray = [];
    let iterator:number=1;
    while (iterator<items+1) {
      this.loaderArray.push(iterator);
      iterator++;
    }
  }

  selectFlight(flight:FlightOffer, type:"OUTBOUND"|"INBOUND"){
    this.flightOffersHandler.selectFlight(flight, this.dictionaries, type==="INBOUND", this.round);
    this.toast.open("Vuelo de "+(type==='OUTBOUND'?'ida':'regreso')+" seleccionado", type==="OUTBOUND"&&this.round?"Deshacer":undefined, {verticalPosition: "top", duration: 5000})
    this.loading = true;
    this.createItemsLoader(6);
    if(this.round&&type==="OUTBOUND"&&this.return!==undefined){
      
    }
  }
  openFilters(){
    this.bs.open(FilterFlightsSheetComponent, { panelClass: 'flight-filter-bottomsheet' });
  }
  createPaginators(totalResults: number, mobile: boolean, actualPage: number = 1): PaginatorData {
    const big: boolean = !mobile;
    const pageSize = big ? 7 : 12;
    const totalPages = Math.ceil(totalResults / pageSize);
    const items: PaginationItem[] = [];
  
    for (let i = 1; i <= totalPages; i++) {
      items.push({
        pageNumber: i,
        active: i === actualPage
      });
    }
  
    let visibleLimit = big ? 7 : 5;
    const showSuspensive: boolean = totalPages > visibleLimit;
    let visible: PaginationItem[] = [];
    let hidden: PaginationItem[] = [];
  
    if (showSuspensive) {
      let visibleItemsCount = big ? 5 : 3; // 5 si es grande, 3 si no
      let start = Math.max(actualPage - 1, 1) - 1; // Ajuste para el índice base 0
      let end = Math.min(start + visibleItemsCount, totalPages);
  
      // Intentar centrar el item activo
      if (actualPage < 3 || totalPages <= visibleItemsCount) {
        start = 0; // Comenzar desde el principio si el activo es uno de los primeros o si hay pocos items
      } else if (actualPage > totalPages - 2) {
        start = Math.max(totalPages - visibleItemsCount, 0); // Ajustar para los últimos items
      } else {
        start = actualPage - 2; // Centrar alrededor del activo
      }
  
      visible = items.slice(start, Math.min(start + visibleItemsCount, items.length));
      hidden = [...items.filter(item => !visible.includes(item))];
    } else {
      // Si no se muestra el suspensivo, todos son visibles
      visible = items;
    }
  
    // El último elemento de la paginación, siempre será el último del total de páginas
    const last: PaginationItem = items[totalPages - 1];
  
    return {
      visible,
      showSuspensive,
      hidden,
      last,
      totalPages,
      actualPage,
      pageStatusString: this.formatFlightPaginationText(totalResults, pageSize, actualPage)
    };
  }
  formatFlightPaginationText(totalResults: number, pageSize: number, actualPage: number): string {
    const firstFlightIndex = (actualPage - 1) * pageSize + 1;
    let lastFlightIndex = actualPage * pageSize;
    lastFlightIndex = lastFlightIndex > totalResults ? totalResults : lastFlightIndex;
  
    return `${firstFlightIndex} – ${lastFlightIndex} de ${totalResults} vuelos`;
  }
}
