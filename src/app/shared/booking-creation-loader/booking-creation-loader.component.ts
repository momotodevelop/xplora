import { CommonModule } from '@angular/common';
import { ApplicationRef, ChangeDetectorRef, Component, Input, NgZone, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCcVisa } from '@fortawesome/free-brands-svg-icons';
import { faCircle } from '@fortawesome/free-regular-svg-icons';
import { faCheckCircle, faCircleNotch } from '@fortawesome/free-solid-svg-icons';
import { NgbProgressbar } from '@ng-bootstrap/ng-bootstrap';
import { SharedDataService } from '../../services/shared-data.service';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SweetAlert2LoaderService, SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';
import { trigger, transition, style, animate } from '@angular/animations';
import { AnimationItem } from 'lottie-web';

export const fadeInOutAnimation = trigger('fadeInOut', [
  transition(':enter', [
    style({ opacity: 0 }), 
    animate('800ms ease-in', style({ opacity: 1 }))
  ]),
  transition(':leave', [
    animate('800ms ease-out', style({ opacity: 0 }))
  ])
]);

export const fadeInOutUpAnimation = trigger('fadeInOutUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(10px)' }), // Inicia con un leve desplazamiento hacia abajo
    animate('800ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
  ]),
  transition(':leave', [
    style({ position: 'absolute', width: '100%' }), // Evita traslapes
    animate('800ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' })) // Se desplaza hacia arriba al desaparecer
  ])
]);

export const fadeInAnimation = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0 }), // Aparece con leve desplazamiento hacia abajo
    animate('800ms ease-out', style({ opacity: 1 }))
  ])
]);

export const fadeInUpAnimation = trigger('fadeInUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(10px)' }), // Inicia un poco más abajo
    animate('800ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

interface StepTextElement {
  type: 'text' | 'icon' | 'currency';
  content?: any;
  text?: string;
  amount?: number;
  icon?: IconDefinition;
  bold?: boolean;
}

interface Step {
  title: string;
  text: StepTextElement[];
  duration: number;
}

@Component({
  selector: 'app-booking-creation-loader',
  standalone: true,
  imports: [
    NgbProgressbar, 
    FontAwesomeModule, 
    CommonModule, 
    MatProgressSpinnerModule, 
    MatButtonModule, 
    MatIconModule,
    SweetAlert2Module,
    LottieComponent
  ],
  templateUrl: './booking-creation-loader.component.html',
  styleUrl: './booking-creation-loader.component.scss',
  animations: [fadeInOutAnimation, fadeInAnimation, fadeInOutUpAnimation, fadeInUpAnimation]
})
export class BookingCreationLoaderComponent implements OnInit {
  @Input() status: 'confirmed' | 'denied' | 'pending' = 'pending';
  @Input() steps: Step[] = [];
  @Input() bookingId!: string;
  progress: number = 0;
  pendingIcon = faCircle;
  readyIcon = faCheckCircle;
  workingIcon = faCircleNotch;
  visaIcon = faCcVisa;
  offset: number = 0;
  currentStepIndex: number = 0;
  totalDuration: number = 0;
  delayCompleted:boolean=false;
  animationItem?:AnimationItem;
  animationOptions!: AnimationOptions;
  constructor(
    private shared: SharedDataService, 
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private appRef: ApplicationRef
  ) {
    this.appRef.isStable.subscribe(stable => {
      if (stable) {
        console.log("✅ Angular ahora está estable.");
      }
    });
  }
  

  ngOnInit(): void {
    this.shared.toggleHideNav(true);
    this.shared.headerHeight.subscribe(h => {
      this.offset = 0;
    });
    let animationUrl;
    switch (this.status) {
      case 'confirmed':
        animationUrl = 'https://lottie.host/9517d359-1e35-4e61-b044-8556e33d9d27/4Va26pzsXX.json';
        break;
      case 'denied':
        animationUrl = 'https://lottie.host/0f547918-f032-40b9-802b-2d366e02310b/5rsP4bHWZu.json';
        break;
      case 'pending':
        animationUrl = 'https://lottie.host/9227e2f1-2cf9-4a34-abc3-71dc783cb5cf/Wur0DM0g2N.json';
        break;
      default:
        break;
    }
    this.animationOptions = {
      path: animationUrl,
      loop: false,
      autoplay: true
    }
    this.initializeSteps();
    this.totalDuration = this.calculateTotalDuration();
    console.log(this.totalDuration);
    this.startProgress();
  }

  private initializeSteps() {
    this.steps = [
      {
        title: 'Confirmando disponibilidad...',
        text: [
          { type: 'text', text: 'Hotel Emperador', bold: true },
          { type: 'text', text: ' - 24 Feb 2025 - 3 Noches' }
        ],
        duration: 3000
      },
      {
        title: 'Creando tu reservación...',
        text: [
          { type: 'text', text: '3 Habitaciones', bold: true },
          { type: 'text', text: ' - 6 Huéspedes' }
        ],
        duration: 2000
      },
      {
        title: 'Confirmando tu pago...',
        text: [
          { type: 'icon', icon: this.visaIcon},
          { type: 'text', text: '****4689', bold: true },
          { type: 'text', text: ' - '},
          { type: 'currency', amount: 22890 }
        ],
        duration: 3000
      }
    ];
  }

  private calculateTotalDuration(): number {
    return this.steps.reduce((acc, step) => acc + step.duration, 0);
  }

  onLoopComplete(){
    console.log("Completed Loop");
  }

  animationCreated(animationItem: AnimationItem): void {
    this.animationItem = animationItem;
  }

  private startProgress() {
    let elapsedTime = 0;
    this.ngZone.runOutsideAngular(() => { // 🔥 Ejecutamos el setInterval fuera de Angular
      const processStep = () => {
        if (this.currentStepIndex >= this.steps.length) {
          setTimeout(() => {
            this.ngZone.run(() => { // 🔥 Volvemos a Angular solo cuando se completa
              this.delayCompleted = true;
              this.progress = 100;
              this.cdr.detectChanges();
              this.appRef.tick();
            });
          }, 0);
          return;
        }
  
        const step = this.steps[this.currentStepIndex];
        const stepProgressIncrement = 100 / this.steps.length;
        let accumulatedProgress = 0;
  
        let interval = setInterval(() => {
          let increment = stepProgressIncrement / (step.duration / 100);
  
          this.ngZone.run(() => { // 🔥 Volvemos a Angular solo cuando es necesario
            this.progress = Math.min(100, this.progress + increment);
            accumulatedProgress += increment;
          });
  
          elapsedTime += 100;
  
          if (elapsedTime >= step.duration || accumulatedProgress >= stepProgressIncrement) {
            clearInterval(interval);
  
            this.ngZone.run(() => { // 🔥 Volvemos a Angular solo cuando el paso cambia
              this.progress = Math.min(100, (this.currentStepIndex + 1) * stepProgressIncrement);
              this.currentStepIndex++;
  
              if (this.currentStepIndex >= this.steps.length) {
                setTimeout(() => {
                  this.delayCompleted = true;
                  this.progress = 100;
                  this.cdr.detectChanges();
                  this.appRef.tick();
                }, 0);
              }
            });
  
            elapsedTime = 0;
            processStep();
          }
        }, 100);
      };
  
      processStep();
    });
  
    // 🔥 Escuchar cuando Angular considere la aplicación estable
    this.ngZone.onStable.subscribe(() => {
      //console.log("✅ Angular detectó que la aplicación ahora está estable.");
      this.appRef.tick(); // 🔥 Forzar actualización final
    });
  }    
  
}
