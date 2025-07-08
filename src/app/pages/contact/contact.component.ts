import { Component, OnInit } from '@angular/core';
import { SharedDataService } from '../../services/shared-data.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFacebook, faInstagram, faWhatsapp, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { MetaHandlerService } from '../../services/meta-handler.service';


@Component({
  selector: 'app-contact',
  imports: [FontAwesomeModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit {
  waIcon=faWhatsapp;
  fbIcon=faFacebook;
  igIcon=faInstagram;
  xIcon=faXTwitter;
  constructor(private shared: SharedDataService, private meta: MetaHandlerService){}
  ngOnInit(): void {
    this.shared.changeHeaderType("dark");
    this.meta.setMeta({
      title: "Xplora Travel || Contacto",
      description: "Ponte en contacto con Xplora para resolver tus dudas, recibir soporte o conocer más sobre nuestros servicios.",
      image: "https://firebasestorage.googleapis.com/v0/b/xploramxv2.firebasestorage.app/o/miniatures%2Fhelp.jpg?alt=media&token=13d17f4c-fcb5-4f20-b36f-93c66e1634a4"
    })
  }
}
