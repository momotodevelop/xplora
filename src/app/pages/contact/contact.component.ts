import { Component, OnInit } from '@angular/core';
import { SharedDataService } from '../../services/shared-data.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFacebook, faInstagram, faWhatsapp, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { MetaHandlerService } from '../../services/meta-handler.service';
import { WhatsAppUrlManagerService } from '../../services/whatsapp-url-manager.service';
import { SiteIdentityService } from '../../services/site-identity.service';


@Component({
  selector: 'app-contact',
  imports: [FontAwesomeModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit {
  readonly site = this.siteIdentity.config;
  readonly contactPhones = this.siteIdentity.getContactPhones();
  readonly whatsappContact = this.siteIdentity.getWhatsAppContact();
  readonly emailHref = this.siteIdentity.getEmailHref();
  waIcon=faWhatsapp;
  fbIcon=faFacebook;
  igIcon=faInstagram;
  xIcon=faXTwitter;
  constructor(
    private shared: SharedDataService,
    private meta: MetaHandlerService,
    public wa: WhatsAppUrlManagerService,
    private siteIdentity: SiteIdentityService
  ){}
  ngOnInit(): void {
    this.shared.changeHeaderType("dark");
    this.meta.setMeta({
      title: `${this.site.brand.name} || Contacto`,
      description: `Ponte en contacto con ${this.site.brand.shortName} para resolver tus dudas, recibir soporte o conocer más sobre nuestros servicios.`,
      image: "https://firebasestorage.googleapis.com/v0/b/xploramxv2.firebasestorage.app/o/miniatures%2Fhelp.jpg?alt=media&token=13d17f4c-fcb5-4f20-b36f-93c66e1634a4"
    })
  }
}
