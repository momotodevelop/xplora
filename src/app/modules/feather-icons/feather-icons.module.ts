import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FeatherModule } from 'angular-feather';
import { Delete } from 'angular-feather/icons';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FeatherModule.pick({
      Delete
    })
  ],
  exports: [FeatherModule]
})
export class FeatherIconsModule { }
