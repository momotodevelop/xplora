import { Component, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { countries } from '../../static/phone-country-codes.static';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FireAuthService } from '../../services/fire-auth.service';

@Component({
    selector: 'app-phone-login-bottom-sheet',
    imports: [MatFormFieldModule, MatInputModule, MatIconModule, MatSelectModule, FontAwesomeModule, ReactiveFormsModule],
    templateUrl: './phone-login-bottom-sheet.component.html',
    styleUrl: './phone-login-bottom-sheet.component.scss'
})
export class PhoneLoginBottomSheetComponent implements OnInit {
  constructor(private _bottomSheetRef: MatBottomSheetRef<PhoneLoginBottomSheetComponent>, private auth: FireAuthService){}
  countries=countries;
  country:string="52";
  phone:FormControl = new FormControl('', [Validators.required, Validators.minLength(10), Validators.maxLength(10)]);
  sendIcon=faPaperPlane;
  ngOnInit(): void {
    (window as any).recaptcha = this.auth.setupRecaptcha("recaptcha-container");
    (window as any).recaptcha.render();
  }
  sendSms(){
    this.auth.signInWithPhoneNumber("+"+this.country+this.phone.value, (window as any).recaptcha).then(ok=>{
      console.log(ok);
    }).catch(err=>{
      console.log(err);
    })
  }
  close(logged:boolean=false){
    this._bottomSheetRef.dismiss(logged);
  }

}
