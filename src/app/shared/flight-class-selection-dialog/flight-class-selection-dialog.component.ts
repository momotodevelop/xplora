import { ChangeDetectorRef, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule, MatSelectionList, MatSelectionListChange } from '@angular/material/list'
import { FlightClass, FlightClassType } from '../../pages/flight-search/search-topbar/search-topbar.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-flight-class-selection-dialog',
    imports: [FormsModule, MatButtonModule, MatCheckboxModule, MatDialogModule, MatDividerModule, MatListModule],
    templateUrl: './flight-class-selection-dialog.component.html',
    styleUrl: './flight-class-selection-dialog.component.scss'
})
export class FlightClassSelectionDialogComponent implements OnInit {
  flightClasses:FlightClass[]=[];
  indeterminate = false;
  allSelected = false;
  selectedOptions:FlightClassType[]=[];
  @ViewChild('classList') classList!: MatSelectionList;

  constructor(@Inject(MAT_DIALOG_DATA) public data: FlightClassType[], private cdr: ChangeDetectorRef, private snackbar: MatSnackBar, private ref: MatDialogRef<FlightClassSelectionDialogComponent>){}

  ngOnInit(): void {
    if(this.data!==undefined){
      this.selectedOptions=this.data;
      this.flightClasses.forEach(flightClass => {
        // Actualiza el estado checked si el id está en el array de IDs seleccionados
        //flightClass.checked = this.data.includes(flightClass.id);
      });
      if(this.data.length>0){
        this.classListChange();
      }
    }
    this.cdr.detectChanges();
  }
  classListChange(){
    const allChecked:boolean=this.allChecked();
    //console.log(allChecked)
    if(allChecked){
      this.allSelected=true;
    }else{
      this.allSelected=false;
    }
  }
  selectAllChange(value:MatSelectionListChange){
    if(value.options[0].selected){
      this.classList.selectAll();
    }else{
      this.classList.deselectAll();
    }
  }
  allChecked() {
    const classString:string[]=this.flightClasses.map(fclass=>fclass.id);
    //console.log(classString);
    //console.log()
    return this.selectedOptions.length===classString.length;
  }
  closeWithData(){
    //console.log(this.selectedOptions.length);
    if(this.selectedOptions.length<1){
      this.snackbar.open("Selecciona al menos una categoria", undefined, {duration: 2000})
    }else{
      this.ref.close(this.selectedOptions);
    }
  }
}
