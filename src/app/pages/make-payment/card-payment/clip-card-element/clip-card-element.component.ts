import { AfterViewInit, Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
declare const ClipSDK: any;
import { clipConfig } from '../../../../../environments/environment'
import { FirebaseBooking } from '../../../../types/booking.types';
import { ClipSDKService } from '../../../../services/clip-sdk.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ClipAuthModalComponent } from './clip-auth-modal/clip-auth-modal.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
@Component({
  selector: 'app-clip-card-element',
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './clip-card-element.component.html',
  styleUrl: './clip-card-element.component.scss'
})
export class ClipCardElementComponent implements AfterViewInit {
  @Input() booking!: FirebaseBooking;
  total:number = 0;
  clipCard:any;
  loading:boolean = false;
  constructor(
    private clip: ClipSDKService, 
    private snackbar: MatSnackBar, 
    private bottomSheet: MatBottomSheet,
    @Inject(PLATFORM_ID) private platformId: Object
  ){}
  ngAfterViewInit(): void {
    this.total = (this.booking.payment!.totalDue-this.booking.payment!.payed);
    if (isPlatformBrowser(this.platformId)) {
      this.initializeClipPayment(this.total);
    }
  }
  initializeClipPayment(paymentAmount: number, termsEnabled:boolean=true){
    const clip = new ClipSDK('Bearer '+clipConfig.apiKey);
    this.clipCard = clip.element.create('Card', {
      locale: 'es',
      paymentAmount,
      terms: {
        enabled: termsEnabled
      }
    });
    this.clipCard.mount('clip_checkout'); 
  }
  async getTokenClip(){
    this.loading = true;
    try{
      const token = await this.clipCard.cardToken();
      const {session_id, user_agent} = await this.clipCard.preventionData();
      const installments = await this.clipCard.installments();
      console.log(token);
      console.log(installments);
      this.clip.createPayment(
        token.id,
        this.total,
        {
          first_name: this.booking.contact!.name,
          last_name: this.booking.contact!.lastname,
          phone: this.booking.contact!.phone,
          email: this.booking.contact!.email
        },
        installments,
        session_id,
        session_id,
        this.booking.bookingID!,
        user_agent,
        "ip"
      ).subscribe({
        next: (response) =>{
          this.loading = false;
          const ok = response.response;
          console.log(ok);
          if(ok.status==='pending'){
            console.log(ok.status_detail);
            if(ok.status_detail.code==='PE-3DS01'){
              ok.pending_action
              if(ok.pending_action){
                const pa = ok.pending_action as {type: string, url: string}
                if(pa.type==='open_modal'){
                  this.snackbar.open('Por favor, autoriza el pago con tu banco en la ventana que se ha abierto.', 'OK', { duration: 3000, verticalPosition: 'top' });
                  this.bottomSheet.open(ClipAuthModalComponent, {
                    data: pa.url,
                    panelClass: 'bottomsheet-no-padding',
                    disableClose: true
                  }).afterDismissed().subscribe((result:{paymentId:string})=>{
                    if(result!==undefined){
                      this.clip.getPaymentStatus(result.paymentId, this.booking.bookingID!).subscribe({
                        next: (response)=>{
                          console.log(response);
                          this.loading = false;
                          this.errorHandler(response.status_detail.code);
                        }
                      })
                    }
                  })
                }
              }
            }
          }else{
            this.loading = false;
            this.errorHandler(ok.status_detail.code);
          }
        },
        error: (error) =>{
          this.loading = false;
          console.log(error.error.error);
          if(error.error.error.error_code==="CL1127"){
            this.snackbar.open("El método de pago no es compatible. Por favor, intenta con otro método de pago.", "OK", { duration: 4000 });
          }
        }
      })
    }catch(error:any){
      this.loading = false;
      console.log(error);
      switch (error.code) {
        case "TCE0001":
            this.snackbar.open('Faltan datos de pago. Por favor, revisa la información ingresada.', "OK", { duration: 2000 });
          break;
        case "CL2200":
        case "CL2290":
          this.snackbar.open(error.message, "OK", {duration: 2000});
          break;
        case "AI1300":
          // Puedes agregar un mensaje específico si lo deseas
          break;
        default:
          break;
      }
    }
  }
  errorHandler(errorCode:string){
    switch (errorCode) {
      // Clip status codes
      case "AP-PAI01":
      this.snackbar.open("Pago realizado exitosamente.", "OK", { duration: 2000 });
      break;
      case "AP-REF01":
      this.snackbar.open("Pago parcialmente reembolsado.", "OK", { duration: 2000 });
      break;
      case "RE-REF01":
      this.snackbar.open("Pago reembolsado.", "OK", { duration: 2000 });
      break;
      case "AU-CAP01":
      this.snackbar.open("Pago pendiente de captura.", "OK", { duration: 2000 });
      break;
      case "CA-AUT01":
      case "CA-MAN01":
      case "CA-MER01":
      this.snackbar.open("Pago cancelado.", "OK", { duration: 2000 });
      break;
      case "RE-BIN01":
      case "RE-ERI03":
      case "RE-CHI01":
      case "RE-ISS19":
      case "RE-ISS20":
      this.snackbar.open("El pago fue rechazado.", "OK", { duration: 2000 });
      break;
      case "RE-3DS01":
      this.snackbar.open("Falló la autenticación 3DS. Intenta de nuevo.", "OK", { duration: 2000 });
      break;
      case "RE-ISS01":
      this.snackbar.open("Fondos insuficientes.", "OK", { duration: 2000 });
      break;
      case "RE-ISS02":
      this.snackbar.open("Pago no autorizado por el banco.", "OK", { duration: 2000 });
      break;
      case "RE-ISS03":
      this.snackbar.open("Tarjeta restringida.", "OK", { duration: 2000 });
      break;
      case "RE-ISS04":
      this.snackbar.open("Tarjeta reservada para uso privado.", "OK", { duration: 2000 });
      break;
      case "RE-ISS05":
      this.snackbar.open("Transacción no permitida al titular.", "OK", { duration: 2000 });
      break;
      case "RE-ISS06":
      this.snackbar.open("Retener tarjeta.", "OK", { duration: 2000 });
      break;
      case "RE-ISS07":
      this.snackbar.open("Tarjeta expirada.", "OK", { duration: 2000 });
      break;
      case "RE-ISS08":
      this.snackbar.open("Límite de retiro excedido.", "OK", { duration: 2000 });
      break;
      case "RE-ISS09":
      this.snackbar.open("PIN inválido (intento único).", "OK", { duration: 2000 });
      break;
      case "RE-ISS10":
      this.snackbar.open("Número de intentos de PIN excedido.", "OK", { duration: 2000 });
      break;
      case "RE-ISS11":
      this.snackbar.open("Consulta con el emisor de la tarjeta.", "OK", { duration: 2000 });
      break;
      case "RE-ISS12":
      this.snackbar.open("Monto inválido.", "OK", { duration: 2000 });
      break;
      case "RE-ISS13":
      this.snackbar.open("Emisor fuera de línea.", "OK", { duration: 2000 });
      break;
      case "RE-ISS14":
      this.snackbar.open("Emisor o switch inoperante.", "OK", { duration: 2000 });
      break;
      case "RE-ISS15":
      this.snackbar.open("Visa/MC fallback.", "OK", { duration: 2000 });
      break;
      case "RE-ISS16":
      this.snackbar.open("Número de tarjeta inválido.", "OK", { duration: 2000 });
      break;
      case "RE-ISS17":
      this.snackbar.open("Comercio inválido.", "OK", { duration: 2000 });
      break;
      case "RE-ISS18":
      this.snackbar.open("Transacción inválida.", "OK", { duration: 2000 });
      break;
      case "RE-ISS99":
      this.snackbar.open("Error genérico. Intenta de nuevo.", "OK", { duration: 2000 });
      break;
      case "RE-ERI05":
      this.snackbar.open("KYC no completado. Contacta a soporte.", "OK", { duration: 2000 });
      break;
      case "PE-EMV01":
      this.snackbar.open("Esperando EMV.", "OK", { duration: 2000 });
      break;
      case "PE-SIG01":
      this.snackbar.open("Esperando firma.", "OK", { duration: 2000 });
      break;
      case "PE-3DS01":
      this.snackbar.open("Esperando autenticación 3DS.", "OK", { duration: 2000 });
      break;
      case "PE-TIC01":
      this.snackbar.open("Esperando pago.", "OK", { duration: 2000 });
      break;
      default:
      this.snackbar.open("Estado desconocido: " + errorCode, "OK", { duration: 2000 });
      break;
    }
  }
}
