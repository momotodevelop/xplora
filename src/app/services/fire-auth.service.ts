import { Injectable } from '@angular/core';
import { Auth, authState, signInAnonymously, signOut, User, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, signInWithPhoneNumber, RecaptchaVerifier, createUserWithEmailAndPassword, signInWithCredential, PhoneAuthProvider, updateProfile, sendPasswordResetEmail, updatePassword } from '@angular/fire/auth';
import { Firestore, collection, doc, docData, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, Timestamp, where } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { BehaviorSubject, EMPTY, from, map, Observable, of, switchMap, timer } from 'rxjs';

export type Role = "traveler"|"xplorer"|"admin"|"superadmin";

export interface UserData {
  uid?: string;
  role: Role;
  email?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  name?: string;
  lastName?: string;
  avatar?: string;
  communications?: {
    receiveOffers: boolean;
    notificationEmail: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class FireAuthService {
  user: Observable<User | null> = EMPTY;
  data: Observable<UserData | null>;
  private _loading = new BehaviorSubject<boolean>(true);
  private _userData$ = new BehaviorSubject<UserData | undefined>(undefined);
  loading: Observable<boolean> = this._loading.asObservable();

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private storage: Storage
  ) {
    this._loading.next(true);
    this.user = authState(this.auth);
    this.data = this.userData.pipe(map(user => user ? user : null));
    timer(2000).subscribe(() => {
      console.log("Loading finished");
      this._loading.next(false);
    });
  }

  /** Login con Google y creación en Firestore */
  async googleLogin() {
    try {
      const credential = await signInWithPopup(this.auth, new GoogleAuthProvider());
      if (credential.user) {
        await this.checkAndCreateUser(credential.user);
      }
      return credential;
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
      throw error;
    }
  }

  /** Verifica y crea documento de usuario en Firestore */
  private async checkAndCreateUser(user: User) {
    const uid = user.uid;
    const email = user.email || '';
    const userRef = doc(this.firestore, `users/${uid}`);
    const role: Role = 'traveler';
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      const full = user.displayName || '';
      const [name, ...rest] = full.split(' ');
      const lastName = rest.join(' ');
      await setDoc(userRef, {
        uid,
        email,
        role,
        name,
        lastName,
        avatar: user.photoURL || '',
        communications: {
          receiveOffers: true,
          notificationEmail: email
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  }

  /** Registro con email/password y creación en Firestore */
  async registerUser(
    name: string,
    lastname: string,
    email: string,
    password: string,
    role: Role = 'traveler'
  ): Promise<void> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      const uid = user.uid;
      const fullName = `${encodeURIComponent(name)}+${encodeURIComponent(lastname)}`;
      const avatarUrl = `https://ui-avatars.com/api/?background=004aad&color=fff&name=${fullName}&rounded=true&bold=true`;
      await updateProfile(user, {
        displayName: `${name} ${lastname}`,
        photoURL: avatarUrl
      });
      const userRef = doc(this.firestore, 'users', uid);
      const dataToSave: UserData = {
        uid,
        role,
        name,
        lastName: lastname,
        avatar: avatarUrl,
        communications: {
          receiveOffers: true,
          notificationEmail: email
        },
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      };
      await setDoc(userRef, dataToSave, { merge: true });
      this._userData$.next(dataToSave);
    } catch (error) {
      console.error('Error al registrar el usuario:', error);
      throw error;
    }
  }

  /** Observable de datos de usuario desde Firestore */
  get userData(): Observable<UserData | null> {
    return authState(this.auth).pipe(
      switchMap(user => {
        if (user) {
          const userRef = doc(this.firestore, 'users', user.uid);
          return docData(userRef, { idField: 'uid' }).pipe(
            switchMap(data => data ? of(data as UserData) : of(null))
          );
        } else {
          return of(null);
        }
      })
    );
  }

  /** Login con email/password */
  emailPassLogin(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  /** Signup con email/password con creación adicional en Firestore */
  emailPassSignup(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password).then(async cred => {
      if (cred.user) await this.checkAndCreateUser(cred.user);
      return cred;
    });
  }

  /** Enviar email para recuperar contraseña */
  resetPassword(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }

  /** Cambiar contraseña (usuario debe estar autenticado) */
  changePassword(newPassword: string) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');
    return updatePassword(user, newPassword);
  }

  /** Actualizar nombre y apellido en Auth y Firestore */
  async updateProfileData(name: string, lastName: string) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');
    await updateProfile(user, { displayName: `${name} ${lastName}` });
    const userRef = doc(this.firestore, `users/${user.uid}`);
    await updateDoc(userRef, { name, lastName, updatedAt: serverTimestamp() });
  }

  /** Subir avatar a Storage y actualizar photoURL en Auth y avatar en Firestore */
  async uploadAvatar(file: File): Promise<string> {
    console.log(file);
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');
    const path = `avatars/${user.uid}/${file.name}`;
    const storageRef = ref(this.storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    await updateProfile(user, { photoURL: url });
    const userRef = doc(this.firestore, `users/${user.uid}`);
    await updateDoc(userRef, { avatar: url, updatedAt: serverTimestamp() });
    return url;
  }

  /** Actualizar preferencias de comunicaciones en Firestore */
  async updateCommunicationsConfig(receiveOffers: boolean, notificationEmail: string) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');
    const userRef = doc(this.firestore, `users/${user.uid}`);
    await updateDoc(userRef, { communications: { receiveOffers, notificationEmail }, updatedAt: serverTimestamp() });
  }

  setupRecaptcha(containerId: string): RecaptchaVerifier {
    return new RecaptchaVerifier(this.auth, containerId, {
      'size': 'normal',
      'callback': (response: any) => console.log("Recaptcha solved", response)
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

  async findUsersByEmail(email: string): Promise<UserData[]> {
    const normalized = String(email ?? '').trim();
    if (!normalized) {
      return [];
    }

    const emailsToTry = Array.from(new Set([normalized, normalized.toLowerCase()]));
    const results: UserData[] = [];

    for (const value of emailsToTry) {
      const q = query(collection(this.firestore, 'users'), where('email', '==', value));
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(item => {
        const data = { uid: item.id, ...(item.data() as UserData) };
        if (!results.some(existing => existing.uid === data.uid)) {
          results.push(data);
        }
      });
    }

    return results;
  }

  async getUserDataByUid(uid: string): Promise<UserData | null> {
    const cleanUid = String(uid ?? '').trim();
    if (!cleanUid) {
      return null;
    }

    const snapshot = await getDoc(doc(this.firestore, 'users', cleanUid));
    if (!snapshot.exists()) {
      return null;
    }

    return { uid: snapshot.id, ...(snapshot.data() as UserData) };
  }
}
