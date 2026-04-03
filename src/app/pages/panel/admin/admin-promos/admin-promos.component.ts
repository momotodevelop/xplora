import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { Timestamp } from '@angular/fire/firestore';
import { SharedDataService } from '../../../../services/shared-data.service';
import { Promo, XploraPromosService } from '../../../../services/xplora-promos.service';
import { AdminPromosFormSheetComponent } from './admin-promos-form-sheet.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MetaHandlerService } from '../../../../services/meta-handler.service';

@Component({
  selector: 'app-admin-promos',
  imports: [
    CommonModule,
    MatButtonModule,
    MatBottomSheetModule
  ],
  templateUrl: './admin-promos.component.html',
  styleUrl: './admin-promos.component.scss'
})
export class AdminPromosComponent implements OnInit {
  headerHeight = 0;
  promosList: Promo[] = [];

  constructor(
    private promos: XploraPromosService,
    private shared: SharedDataService,
    private bottomSheet: MatBottomSheet,
    private snackBar: MatSnackBar,
    private meta: MetaHandlerService
  ) {
    this.shared.headerHeight.subscribe(height => {
      this.headerHeight = height;
    });
  }

  ngOnInit(): void {
    this.meta.setMeta({
      title: 'Xplora Travel || Admin || Promociones',
      description: 'Crea y administra promociones y códigos de descuento en Xplora Travel.',
      image: '/assets/img/banner-generico.jpg'
    });
    this.promos.getAllPromos().subscribe(promos => {
      this.promosList = promos;
    });
  }

  openCreateSheet() {
    this.bottomSheet.open(AdminPromosFormSheetComponent, {
      panelClass: 'custom-bottom-sheet'
    });
  }

  editPromo(promo: Promo) {
    this.bottomSheet.open(AdminPromosFormSheetComponent, {
      panelClass: 'custom-bottom-sheet',
      data: { promo }
    });
  }

  async toggleActive(promo: Promo) {
    if (!promo.promoID) return;
    try {
      await this.promos.editPromo(promo.promoID, { isActive: !promo.isActive });
    } catch (error) {
      this.snackBar.open('No se pudo actualizar el estado.', 'OK', { duration: 1800 });
    }
  }

  promoExpiryDate(promo: Promo): Date {
    return promo.expiryDate instanceof Timestamp
      ? promo.expiryDate.toDate()
      : new Date(promo.expiryDate as Date);
  }
}
