import { ChangeDetectorRef, Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FireAuthService, UserData } from '../../services/fire-auth.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
@Component({
    selector: 'shared-login',
    imports: [MatSnackBarModule, FontAwesomeModule, MatBottomSheetModule, CommonModule, ReactiveFormsModule, FormsModule, MatButtonModule, MatIconModule, RouterModule],
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
  loading:boolean = false;
  @Input() rounded:boolean = true;
  @Input() floating:boolean = true;
  user:User|null=null;
  userData:UserData|null = null;
  @Input() isBottomSheet:boolean = false; // Si es un bottom sheet, se usa un estilo diferente
  @Output() logged = new EventEmitter<boolean>();
  @Output() closeBottomSheet = new EventEmitter<void>();
  name: FormControl = new FormControl(null, {validators: [Validators.required, Validators.minLength(3)]});
  lastname: FormControl = new FormControl(null, {validators: [Validators.required, Validators.minLength(3)]});
  email: FormControl = new FormControl(null, {validators: [Validators.required, Validators.email]});
  password: FormControl = new FormControl(null, {validators: [Validators.required, Validators.minLength(6)]});
  constructor(
    private cdr: ChangeDetectorRef, 
    private auth: FireAuthService, 
    private route: ActivatedRoute, 
    private sharedService: SharedDataService, 
    private sb: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
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
      this.user = user;
      console.log(user);
    });
    this.auth.data.subscribe(user=>{
      this.userData = user;
      this.userData?.name
    });
  }
  isGoogleUser(user: User): boolean {
    return user.providerData.some(provider => provider.providerId === 'google.com');
  }
  googleLogin(){
    this.auth.googleLogin().then(ok=>{
      this.sb.open("Bienvenido "+(ok.user.displayName ?? 'viajero'), "OK", {duration: 2500});
      //console.log(ok);
    }).catch(err=>{
      console.log(err);
      this.sb.open("Error Iniciando Sesión", "OK", {duration: 1500});
    });
  }
  logout(){
    this.auth.logout().then(ok=>{
      this.sb.open("Sesión cerrada", "OK", {duration: 1500});
      this.logged.emit(false);
      this.closeBottomSheet.emit();
    });
  }
  goTo(route: string) {
    this.closeBottomSheet.emit();
    this.router.navigate([route]);
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
  get newUserValidData():boolean{
    return this.name.valid && this.lastname.valid && this.email.valid && this.password.valid;
  }
  createAccount(){
    //console.log(creating);
    if(!this.newUserValidData){
      this.sb.open("Por favor completa todos los campos", "OK", {duration: 1500});
      return;
    }
    this.auth.registerUser(this.name.value, this.lastname.value, this.email.value, this.password.value).then(ok=>{
      this.sb.open("Cuenta creada con éxito", "OK", {duration: 1500});
    }).catch(err=>{
      this.sb.open("Error creando cuenta", "OK", {duration: 1500});
    });
    this.cdr.detectChanges();
  }
  get profileAvatar():string{
    if(this.user?.photoURL){
      return this.user.photoURL;
    } else if(this.userData){
      if(this.userData.name && this.userData.lastName){
        return `https://ui-avatars.com/api/?background=004aad&color=fff&name=${this.userData.name}+${this.userData.lastName}&rounded=true&bold=true`;
      }else{
        if(this.user?.displayName){
          const name = this.user.displayName.replace(/\s+/g, '+') || '';
          return `https://ui-avatars.com/api/?background=004aad&color=fff&name=${name}+&rounded=true&bold=true`;
        }else{
          return `https://ui-avatars.com/api/?background=004aad&color=fff&name=Xplora+Travel&rounded=true&bold=true`;
        }
      }
    }else{
      return `https://ui-avatars.com/api/?background=004aad&color=fff&name=Xplora+Travel&rounded=true&bold=true`;
    }
  }
}
