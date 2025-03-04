import { Component, OnInit } from '@angular/core';
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
import { LoginComponent } from '../../shared/login/login.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-login',
    imports: [MatSnackBarModule, FontAwesomeModule, MatBottomSheetModule, LoginComponent, CommonModule],
    templateUrl: './login-page.component.html',
    styleUrl: './login-page.component.scss'
})
export class LoginPageComponent implements OnInit {
  mobileIcon=faMobile;
  anonIcon=faUserSecret;
  googleIcon=faGoogle;
  recaptcha:any;
  createNewAccount:boolean = false;
  loading:boolean = false;
  constructor(public auth: FireAuthService, private route: ActivatedRoute, private sharedService: SharedDataService, private sb: MatSnackBar, private bs: MatBottomSheet){
    this.auth.loading.subscribe(loading=>{
      this.loading = loading;
      console.log(loading);
    });
  }

  ngOnInit(): void {
    this.route.data.pipe(
      map(data => data["headerType"])
    ).subscribe((type: "light"|"dark") => {
      console.log(type);
      //this.headerType = type;
      this.sharedService.changeHeaderType(type);
    });
    this.auth.user.subscribe(user=>{
      console.log(user);
    });
    console.log("Init Login Page");
    this.auth.loading.subscribe(loading=>{
      this.loading = loading;
      console.log(loading);
    });
  }
  googleLogin(){
    this.auth.googleLogin().then(ok=>{
      this.sb.open("Bienvenido "+ok.user.displayName, "OK", {duration: 2500});
      console.log(ok);
    }).catch(err=>{
      console.log(err);
      this.sb.open("Error Iniciando Sesión", "OK", {duration: 1500});
    });
  }
  anonLogin(){
    this.auth.anonLogin().then(ok=>{
      this.sb.open("Bienvenido usuario anónimo", "OK", {duration: 1500});
    }).catch(err=>{
      console.log(err);
      this.sb.open("Error Iniciando Sesión", "OK", {duration: 1500});
    });
  }
  phoneLogin(){
    this.bs.open(PhoneLoginBottomSheetComponent, {panelClass: 'custom-bottom-sheet'});
  }
  createAccount(creating:boolean=false){
    this.createNewAccount = creating;
  }
}
