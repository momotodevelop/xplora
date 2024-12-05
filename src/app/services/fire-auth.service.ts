import { Injectable, Optional } from '@angular/core';
import { Auth, authState, signInAnonymously, signOut, User, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, signInWithPhoneNumber, RecaptchaVerifier, createUserWithEmailAndPassword, signInWithCredential, PhoneAuthProvider } from '@angular/fire/auth';
import { EMPTY, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { traceUntilFirst } from '@angular/fire/performance';

@Injectable({
  providedIn: 'root'
})
export class FireAuthService {
  user:Observable<User|null> = EMPTY;
  constructor(private auth: Auth) {
    if(auth){this.user = authState(this.auth)}
  }
  googleLogin(){
    return signInWithPopup(this.auth, new GoogleAuthProvider())
  }
  emailPassLogin(email:string, password:string){
    return signInWithEmailAndPassword(this.auth, email, password);
  }
  emailPassSignup(email:string, password:string){
    return createUserWithEmailAndPassword(this.auth, email, password);
  }
  setupRecaptcha(containerId: string) {
    return new RecaptchaVerifier(this.auth, containerId, {
      'size': 'normal',
      'callback': (response: any) => {
        // Recaptcha solved
      }
    });
  }
  signInWithPhoneNumber(phoneNumber: string, appVerifier: RecaptchaVerifier) {
    return signInWithPhoneNumber(this.auth, phoneNumber, appVerifier);
  }
  verifyPhoneLogin(id:string, code:string){
    signInWithCredential(this.auth, PhoneAuthProvider.credential(id, code));
  }
  anonLogin(){
    return signInAnonymously(this.auth);
  }
  logout(){
    return signOut(this.auth);
  }

}
