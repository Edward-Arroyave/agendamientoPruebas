import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ModalData } from '../../shared/globales/Modaldata';
import { ModalGeneralComponent } from '../../shared/modals/modal-general/modal-general.component';
import { Subject, takeUntil } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalService {

  constructor(private dialog: MatDialog) { }

  openStatusMessage(btn:string,mensaje:string,type:string,mensaje2? : string,width:string ='450px'){
    const destroy$: Subject<boolean> = new Subject<boolean>();
    const data: ModalData = {
      btn: '',
      btn2: btn,
      footer:true,
      message:mensaje,
      message2:mensaje2,
      type:type
    };

    const dialogRef = this.dialog.open(ModalGeneralComponent, { height:'auto' ,width, data, disableClose: true });
    
    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(x =>{
      dialogRef.close();
    });
  }
}
