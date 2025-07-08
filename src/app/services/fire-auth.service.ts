import { Injectable } from '@angular/core';
import { Auth, authState, signInAnonymously, signOut, User, GoogleAuthProvider, getAuth, signInWithPopup, signInWithEmailAndPassword, signInWithPhoneNumber, RecaptchaVerifier, createUserWithEmailAndPassword, signInWithCredential, PhoneAuthProvider } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore'; // ✅ Nueva API modular de Firestore
import { BehaviorSubject, EMPTY, from, Observable, of, switchMap } from 'rxjs';
export type Role = "traveler"|"xplorer"|"admin"|"superadmin";
interface UserData {
  uid: string;
  role: Role;
  createdAt?: Date;
  updatedAt?: Date;
  name?: string;
  lastName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FireAuthService {
  user: Observable<User | null> = EMPTY;
  role: Observable<Role | null>;
  private _loading = new BehaviorSubject<boolean>(true);
  loading:Observable<boolean> = this._loading.asObservable();

  constructor(private auth: Auth, private firestore: Firestore) {
    // Obtenemos el usuario actual desde Firebase
    this.user = authState(this.auth);

    // Obtenemos el rol del usuario cuando cambia la autenticación
    this.role = this.user.pipe(
      switchMap(user => {
        if (!user) {
          this._loading.next(false);
          return of(null)
        };
        return this.getUserRole(user.uid);
      })
    );
  }

  async googleLogin() {
    try {
      const credential = await signInWithPopup(this.auth, new GoogleAuthProvider());

      if (credential.user) {
        await this.checkAndCreateUser(credential.user.uid, credential.user.email!);
      }

      return credential;
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
      throw error;
    }
  }

  private async checkAndCreateUser(uid: string, email: string) {
    const userRef = doc(this.firestore, `users/${uid}`);
    const role:Role = "traveler";  // Rol por defecto
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid,
        email,
        role
      });
    }
  }

  getUserRole(uid: string): Observable<Role | null> { 
    const userRef = doc(this.firestore, `users/${uid}`);

    return from(getDoc(userRef)).pipe(
      switchMap(userDoc => {
        this._loading.next(false);
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData;
          return of(userData.role);
        }
        return of(null);
      })
    );
  }

  emailPassLogin(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  emailPassSignup(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  setupRecaptcha(containerId: string):RecaptchaVerifier {
    return new RecaptchaVerifier(this.auth, containerId, {
      'size': 'normal',
      'callback': (response: any) => {
        // Recaptcha solved
        console.log("Recaptcha solved", response);
      }
    });
  }

  signInWithPhoneNumber(phoneNumber: string, appVerifier: RecaptchaVerifier) {
    return signInWithPhoneNumber(this.auth, phoneNumber, appVerifier);
  }

  verifyPhoneLogin(id: string, code: string) {
    return signInWithCredential(this.auth, PhoneAuthProvider.credential(id, code));
  }

  anonLogin() {
    return signInAnonymously(this.auth);
  }

  logout() {
    return signOut(this.auth);
  }
}
