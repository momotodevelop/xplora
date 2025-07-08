import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FireAuthService } from '../../services/fire-auth.service';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { SharedDataService } from '../../services/shared-data.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMobile, faUserSecret } from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { PhoneLoginBottomSheetComponent } from '../../shared/phone-login-bottom-sheet/phone-login-bottom-sheet.component';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { User } from 'firebase/auth';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'shared-login',
    imports: [MatSnackBarModule, FontAwesomeModule, MatBottomSheetModule, CommonModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss',
    animations: [
      trigger('fadeInOut', [
        transition(':enter', [ // Cuando aparece
          style({ opacity: 0, height: '0px', overflow: 'hidden' }),
          animate('500ms ease-in', style({ opacity: 1, height: '*' })) // '*' permite expandir a su tamaño natural
        ]),
        transition(':leave', [ // Cuando desaparece
          animate('500ms ease-out', style({ opacity: 0, height: '0px', overflow: 'hidden' }))
        ])
      ])
    ]
})
export class LoginComponent implements OnInit {
  mobileIcon=faMobile;
  anonIcon=faUserSecret;
  googleIcon=faGoogle;
  createNewAccount:boolean = false;
  @Input() rounded:boolean = true;
  @Input() floating:boolean = true;
  @Input() user?:User;
  @Input() isBottomSheet:boolean = false; // Si es un bottom sheet, se usa un estilo diferente
  @Output() logged = new EventEmitter<boolean>();
  constructor(
    private cdr: ChangeDetectorRef, 
    private auth: FireAuthService, 
    private route: ActivatedRoute, 
    private sharedService: SharedDataService, 
    private sb: MatSnackBar,
    private dialog: MatDialog
  ){}

  ngOnInit(): void {
    this.route.data.pipe(
      map(data => data["headerType"])
    ).subscribe((type: "light"|"dark") => {
      //console.log(type);
      //this.headerType = type;
      this.sharedService.changeHeaderType(type);
    });
    this.auth.user.subscribe(user=>{
      console.log(user);
    });
  }
  googleLogin(){
    this.auth.googleLogin().then(ok=>{
      this.sb.open("Bienvenido "+ok.user.displayName, "OK", {duration: 2500});
      //console.log(ok);
    }).catch(err=>{
      //console.log(err);
      this.sb.open("Error Iniciando Sesión", "OK", {duration: 1500});
    });
  }
  anonLogin(){
    this.auth.anonLogin().then(ok=>{
      this.sb.open("Bienvenido usuario anónimo", "OK", {duration: 1500});
    }).catch(err=>{
      //console.log(err);
      this.sb.open("Error Iniciando Sesión", "OK", {duration: 1500});
    });
  }
  phoneLogin(){
    this.dialog.open(PhoneLoginBottomSheetComponent, {panelClass: 'custom-bottom-sheet'});
  }
  createAccount(creating:boolean=false){
    //console.log(creating);
    this.createNewAccount = creating;
    this.cdr.detectChanges();
  }
}
