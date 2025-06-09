import { Component, Input, OnInit } from '@angular/core';
import { map, Observable } from 'rxjs';
import { StorageService } from '../../services/storage.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CurrencyInputDirective } from '../../currency-input.directive';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { FireBookingService } from '../../services/fire-booking.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OfflinePaymentData } from '../../types/booking.types';
import { TimeAgoPipe } from '../../time-ago.pipe';
import { Timestamp } from 'firebase/firestore';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faClock, faHistory } from '@fortawesome/free-solid-svg-icons';

export interface Institucion {
  [0]: string; // Código de institución
  [1]: string; // Nombre de la institución
}

export interface InstitucionesResponse {
  instituciones: Institucion[];
  institucionesMISPEI?: Institucion[];
  overrideCaptcha?: boolean;
}

export const SPEI_BANKS:InstitucionesResponse = {
  instituciones: [
    ["40133", "ACTINVER"],
    ["40062", "AFIRME"],
    ["90721", "albo"],
    ["90706", "ARCUS FI"],
    ["90659", "ASP INTEGRA OPC"],
    ["40128", "AUTOFIN"],
    ["40127", "AZTECA"],
    ["37166", "BaBien"],
    ["40030", "BAJIO"],
    ["40002", "BANAMEX"],
    ["40154", "BANCO COVALTO"],
    ["37006", "BANCOMEXT"],
    ["40137", "BANCOPPEL"],
    ["40160", "BANCO S3"],
    ["40152", "BANCREA"],
    ["37019", "BANJERCITO"],
    ["40147", "BANKAOOL"],
    ["40106", "BANK OF AMERICA"],
    ["40159", "BANK OF CHINA"],
    ["37009", "BANOBRAS"],
    ["40072", "BANORTE"],
    ["40058", "BANREGIO"],
    ["40060", "BANSI"],
    ["2001", "BANXICO"],
    ["40129", "BARCLAYS"],
    ["40145", "BBASE"],
    ["40012", "BBVA MEXICO"],
    ["40112", "BMONEX"],
    ["90677", "CAJA POP MEXICA"],
    ["90683", "CAJA TELEFONIST"],
    ["90715", "Cartera Digital"],
    ["90630", "CB INTERCAM"],
    ["40143", "CIBANCO"],
    ["90631", "CI BOLSA"],
    ["40124", "CITI MEXICO"],
    ["90901", "CLS"],
    ["90903", "CoDi Valida"],
    ["40130", "COMPARTAMOS"],
    ["40140", "CONSUBANCO"],
    ["90652", "CREDICAPITAL"],
    ["90688", "CREDICLUB"],
    ["90680", "CRISTOBAL COLON"],
    ["90723", "Cuenca"],
    ["40151", "DONDE"],
    ["90616", "FINAMEX"],
    ["90634", "FINCOMUN"],
    ["90734", "FINCO PAY"],
    ["90689", "FOMPED"],
    ["90699", "FONDEADORA"],
    ["90685", "FONDO (FIRA)"],
    ["90601", "GBM"],
    ["40167", "HEY BANCO"],
    ["37168", "HIPOTECARIA FED"],
    ["40021", "HSBC"],
    ["40155", "ICBC"],
    ["40036", "INBURSA"],
    ["90902", "INDEVAL"],
    ["40150", "INMOBILIARIO"],
    ["40136", "INTERCAM BANCO"],
    ["40059", "INVEX"],
    ["40110", "JP MORGAN"],
    ["90661", "KLAR"],
    ["90653", "KUSPIT"],
    ["90670", "LIBERTAD"],
    ["90602", "MASARI"],
    ["90722", "Mercado Pago W"],
    ["40042", "MIFEL"],
    ["40158", "MIZUHO BANK"],
    ["90600", "MONEXCB"],
    ["40108", "MUFG"],
    ["40132", "MULTIVA BANCO"],
    ["37135", "NAFIN"],
    ["90638", "NU MEXICO"],
    ["90710", "NVIO"],
    ["40148", "PAGATODO"],
    ["90732", "Peibo"],
    ["90620", "PROFUTURO"],
    ["40156", "SABADELL"],
    ["40014", "SANTANDER"],
    ["40044", "SCOTIABANK"],
    ["40157", "SHINHAN"],
    ["90728", "SPIN BY OXXO"],
    ["90646", "STP"],
    ["90703", "TESORED"],
    ["90684", "TRANSFER"],
    ["40138", "UALA"],
    ["90656", "UNAGRA"],
    ["90617", "VALMEX"],
    ["90605", "VALUE"],
    ["90608", "VECTOR"],
    ["40113", "VE POR MAS"],
    ["40141", "VOLKSWAGEN"]
  ]
} 

interface DisplaySavedOfflinePayment extends OfflinePaymentData {
  timestamp: Timestamp
}


@Component({
  selector: 'app-upload-payment-receipt',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatListModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    CurrencyInputDirective,
    FormsModule,
    MatSelectModule,
    ReactiveFormsModule,
    FormsModule,
    MatProgressSpinnerModule,
    TimeAgoPipe,
    FontAwesomeModule
  ],
  templateUrl: './upload-payment-receipt.component.html',
  styleUrl: './upload-payment-receipt.component.scss'
})
export class UploadPaymentReceiptComponent implements OnInit {
  @Input() bookingID: string = 'prueba'; // ID de la reserva para la que se subirá el comprobante
  selectedFile: File | undefined;
  uploadProgress: Observable<number | string> | null = null;
  downloadURL: string | null = null;
  uploading: boolean = false;
  uploadSuccess: boolean = false;
  uploadError: boolean = false;
  newPaymentAmount: number | null = null; // Nuevo campo para el monto del pago
  senderBank: FormControl = new FormControl(null, [Validators.required]);
  paymentOffice: FormControl = new FormControl(null, [Validators.required]);
  amount: FormControl = new FormControl(null, [Validators.required, Validators.min(0.01)]); // Campo para el monto del pago
  banks: Institucion[] = SPEI_BANKS.instituciones; // Lista de bancos activos
  savedPayments: DisplaySavedOfflinePayment[] = []; // Lista de pagos guardados
  timeIcon = faHistory;
  constructor(private storageService: StorageService, private snackBar: MatSnackBar, private bookingService: FireBookingService){}

  ngOnInit(): void {
    console.log(this.savedPayments[0]);
    this.bookingService.getOfflinePaymentsByBooking(this.bookingID).then(payments=>{
      this.savedPayments = payments as DisplaySavedOfflinePayment[];
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onFileDropped(event: DragEvent) {
    event.preventDefault();

    if (event.dataTransfer?.files.length) {
      const file = event.dataTransfer.files[0];
      this.validarYSeleccionarArchivo(file);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files?.length) {
      const file = input.files[0];
      this.resetUploadState();
      this.validarYSeleccionarArchivo(file);
    }
  }

  validarYSeleccionarArchivo(file: File):File | undefined {
    const formatosPermitidos = ['image/jpeg', 'image/png', 'application/pdf'];
    const tamañoMaximo = 5 * 1024 * 1024; // 5 MB

    if (!formatosPermitidos.includes(file.type)) {
      this.snackBar.open('Formato no permitido. Usa JPG, PNG o PDF.', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    if (file.size > tamañoMaximo) {
      this.snackBar.open('El archivo es demasiado grande. Máximo permitido: 5 MB.', 'Cerrar', {
        duration: 3000,
      });
      return;
    }
    console.log('Archivo seleccionado:', file);
    this.selectedFile = file;
    return file;
  }

  testUpload(){
    console.log(this.amount.value);
    console.log(this.senderBank.value);
  }

  uploadFile(): void {
    if (this.selectedFile) {
      this.uploading = true;
      this.uploadSuccess = false;
      this.uploadError = false;

      // Define la ruta en Firebase Storage. Puedes personalizarla.
      // Por ejemplo, usando un ID de usuario o de transacción para organizar.
      const filePath = `comprobantes_pago/${this.bookingID}/${this.selectedFile.name}`;

      this.uploadProgress = this.storageService.uploadFile(this.selectedFile, filePath);
      this.uploadProgress.subscribe({
        next: (data: number | string) => {
          if (typeof data === 'number') {
            console.log('Progreso de subida:', data);
            // Aquí podrías actualizar una barra de progreso en el HTML
          } else if (typeof data === 'string') {
            this.downloadURL = data;
            this.uploading = false;
            this.uploadSuccess = true;
            console.log('Archivo subido con éxito. URL:', this.downloadURL);
            this.snackBar.open('Comprobante subido exitosamente.', 'Cerrar', {
              duration: 2500,
            });
            this.selectedFile = undefined; // Limpiar el archivo seleccionado
            this.bookingService.addPaymentToBooking(this.bookingID, {
              amount: this.amount.value || 0, // Usa el nuevo monto del pago o 0 si no se especifica
              method: 'SPEI',
              senderBank: this.senderBank.value,
              status: 'VALIDATING',
              timestamp: new Timestamp(new Date().getTime() / 1000, 0), // Timestamp de Firestore
              receptURL: this.downloadURL
            }).then(payments=>{
              this.savedPayments = payments as DisplaySavedOfflinePayment[];
              this.amount.reset();
              this.senderBank.reset();
            });
          }
        },
        error: (error) => {
          this.uploading = false;
          this.uploadError = true;
          console.error('Error al subir el archivo:', error);
        },
        complete: () => {
          // opcional, si necesitas manejar el fin del observable
          console.log('Subida completada');
        }
      });
    } else {
      console.warn('Ningún archivo seleccionado.');
    }
  }

  resetUploadState(): void {
    this.uploading = false;
    this.uploadSuccess = false;
    this.uploadError = false;
    this.downloadURL = null;
    this.uploadProgress = null;
  }
  
}
