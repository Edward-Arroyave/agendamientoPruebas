import { NgClass, NgFor, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component, input, output, SimpleChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ToggleComponent } from "../../inputs/toggle/toggle.component";

@Component({
  selector: 'app-tabla-permisos',
  standalone: true,
  imports: [MatIconModule, ToggleComponent, NgClass],
  templateUrl: './tabla-permisos.component.html',
  styleUrl: './tabla-permisos.component.scss'
})
export class TablaPermisosComponent {


  columnsHeader = input<string[]>([], { alias: 'cabeceros' });
  pagedData: any[] = [];;

  columnsBody = input<any[]>([], { alias: 'info-tabla' });



  onChangePrincipal = output<any[]>(); // Cambio de toggle crear principal
  onChangeChild = output<any[]>(); // Cambio de toggle crear principal


  toggleExpand(row: any) {
    for (const item of this.pagedData) {

      if(item.idMenu == row.idMenu){
        item.expanded =  !item.expanded
      }else{
        item.expanded = false
      }

    }

  }

  constructor(private cd: ChangeDetectorRef) {
  }



  ngOnInit(): void {
    this.updatePagedData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columnsBody'] && !changes['columnsBody'].isFirstChange()) {
      this.updatePagedData();
      this.cd.detectChanges();
    }
  }

  updatePagedData() {
    this.pagedData = this.columnsBody()
  }

  //Acciones desde los toggles

  cambiaPadre(data: any, valor: any, item : string) {
    this.onChangePrincipal.emit([data, valor, item]);
  }
  cambiaHijo(data: any, valor: any, item : string) {
    this.onChangeChild.emit([data, valor, item]);
  }






}
