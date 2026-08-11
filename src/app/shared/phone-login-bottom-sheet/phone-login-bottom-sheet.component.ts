import { Component, NgZone, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { countries } from '../../static/phone-country-codes.static';
import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FireAuthService } from '../../services/fire-auth.service';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { RecaptchaVerifier } from 'firebase/auth';
import { XploraBottomSheetComponent } from '../xplora-bottom-sheet/xplora-bottom-sheet.component';

@Component({
    selector: 'app-phone-login-bottom-sheet',
    imports: [
      MatFormFieldModule, 
      MatInputModule, 
      MatIconModule, 
      MatSelectModule, 
      FontAwesomeModule, 
      ReactiveFormsModule,
      XploraBottomSheetComponent
    ],
    templateUrl: './phone-login-bottom-sheet.component.html',
    styleUrl: './phone-login-bottom-sheet.component.scss'
})
export class PhoneLoginBottomSheetComponent implements OnInit {
  constructor(private bottomSheetRef: MatBottomSheetRef<PhoneLoginBottomSheetComponent>, private auth: FireAuthService, private zone: NgZone){}
  countries=countries;
  country:string="52";
  phone:FormControl = new FormControl('', [Validators.required, Validators.minLength(10), Validators.maxLength(10)]);
  sendIcon=faPaperPlane;
  private recaptchaVerifier!: RecaptchaVerifier;
  ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      this.recaptchaVerifier = this.auth.setupRecaptcha('recaptcha-container');
      console.log('🟣 reCAPTCHA configurado:', this.recaptchaVerifier);
      this.recaptchaVerifier.render().then(widgetId => {
        console.log('🟣 reCAPTCHA widget ID:', widgetId);
      }).catch(err => {
        console.error('❌ Error al renderizar reCAPTCHA:', err);
      });
    });
  }
  sendSms(){
    this.auth.signInWithPhoneNumber("+"+this.country+this.phone.value, this.recaptchaVerifier).then(ok=>{
      console.log(ok);
    }).catch(err=>{
      console.log(err);
    })
  }
  close(logged:boolean=false){
    this.bottomSheetRef.dismiss(logged);
  }

}
