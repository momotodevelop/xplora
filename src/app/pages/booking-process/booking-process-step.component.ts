import { AfterViewInit, Component, Signal, ViewChild, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, ROUTER_OUTLET_DATA } from '@angular/router';
import { BookingProcessComponent, Steps } from './booking-process.component';
import { ContactInfoComponent } from './contact-info/contact-info.component';
import { ExtrasComponent } from './extras/extras.component';
import { PassengersComponent } from './passengers/passengers.component';
import { PaymentComponent } from './payment/payment.component';
import { SeatsComponent } from './seats/seats.component';

@Component({
  selector: 'app-booking-process-step',
  imports: [
    MatButtonModule,
    MatIconModule,
    ContactInfoComponent,
    PassengersComponent,
    SeatsComponent,
    ExtrasComponent,
    PaymentComponent
  ],
  templateUrl: './booking-process-step.component.html',
  styleUrl: './booking-process-step.component.scss'
})
export class BookingProcessStepComponent implements AfterViewInit {
  @ViewChild(PassengersComponent) passengersForm?: PassengersComponent;
  @ViewChild(ExtrasComponent) extras?: ExtrasComponent;

  private readonly outletData = inject(ROUTER_OUTLET_DATA) as Signal<BookingProcessComponent>;
  private readonly route = inject(ActivatedRoute);

  readonly step = this.route.snapshot.data['step'] as Steps;

  get flow(): BookingProcessComponent {
    return this.outletData();
  }

  get currentStep() {
    return this.flow.steps[this.flow.activeStep];
  }

  get previousStepTitle(): string {
    return this.flow.steps[this.flow.activeStep - 1]?.title ?? '';
  }

  get isFinalStep(): boolean {
    return this.flow.activeStep === this.flow.steps.length - 1;
  }

  ngAfterViewInit(): void {
    if (this.step === 'EXTRAS' && this.flow.consumeInsuranceRequest()) {
      setTimeout(() => this.openInsurance());
    }
  }

  openInsurance(): void {
    this.extras?.openInsurance();
  }
}
