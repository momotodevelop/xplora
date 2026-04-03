import { Component, OnInit } from '@angular/core';
import { FireAuthService } from '../../../../../services/fire-auth.service';
import { User } from '@angular/fire/auth';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MetaHandlerService } from '../../../../../services/meta-handler.service';

@Component({
  selector: 'app-traveler-profile-settings',
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './traveler-profile-settings.component.html',
  styleUrl: './traveler-profile-settings.component.scss'
})
export class TravelerProfileSettingsComponent implements OnInit {
  user?: User | null;
  userDataForm: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required]),
    lastName: new FormControl('', [Validators.required])
  });
  constructor(
    public auth: FireAuthService,
    private snackBar: MatSnackBar,
    private meta: MetaHandlerService
  ){}
  ngOnInit(): void {
    this.meta.setMeta({
      title: 'Xplora Travel || Mi Cuenta || Ajustes de Perfil',
      description: 'Actualiza tus datos personales y foto de perfil en tu cuenta de Xplora Travel.',
      image: '/assets/img/banner-generico.jpg'
    });
    this.auth.user.subscribe(user => {
      this.user = user;
    });
    this.auth.userData.subscribe(userData=>{
      if(userData){
        if(userData.name){
          this.userDataForm.controls["name"].setValue(userData.name);
        }
        if(userData.lastName){
          this.userDataForm.controls["lastName"].setValue(userData.lastName);
        }
      }
    })
  }
  updateImage(file: File): void {
    this.auth.uploadAvatar(file).then(ok=>{
      console.log("Image updated successfully", ok);
      this.snackBar.open('Imagen actualizada correctamente.', 'Cerrar', {
        duration: 3000,
      });
    }).catch(error => {
      console.error("Error updating image:", error);
      this.snackBar.open('Error al actualizar la imagen. Inténtalo de nuevo.', 'Cerrar', {
        duration: 3000,
      });
    })
  }
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files?.length) {
      const file = input.files[0];
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
    //console.log('Archivo seleccionado:', file);
    this.updateImage(file);
    return file;
  }
  updateTravelerData(){
    const name = this.userDataForm.controls["name"].value;
    const lastname = this.userDataForm.controls["lastName"].value;
    this.auth.updateProfileData(name, lastname).then(()=>{
      this.snackBar.open('Datos actualizados correctamente.', 'Cerrar', {
        duration: 3000,
      });
    }).catch(error => {
      console.error("Error updating profile data:", error);
      this.snackBar.open('Error al actualizar los datos. Inténtalo de nuevo.', 'Cerrar', {
        duration: 3000,
      });
    });
  }
}
