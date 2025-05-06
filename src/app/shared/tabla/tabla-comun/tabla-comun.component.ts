import { ChangeDetectorRef, Component, OnInit, SimpleChanges, ViewChild, effect, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule } from '@angular/material/sort';
import {  MatTableModule } from '@angular/material/table';
import { ToggleComponent } from '../../inputs/toggle/toggle.component';
import { NgxPaginationModule, PaginationInstance } from 'ngx-pagination';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TooltipIfTruncatedDirective } from '@app/shared/directivas/tooltip-if-truncated.directive';



@Component({
  selector: 'app-tabla-comun',
  standalone: true,
  imports: [
    MatSortModule,
    MatTableModule,
    MatFormFieldModule,
    MatIconModule,
    MatIcon,
    ToggleComponent,
    NgxPaginationModule,
    MatTooltipModule,
    TooltipIfTruncatedDirective
  ],
  templateUrl: './tabla-comun.component.html',
  styleUrl: './tabla-comun.component.css'
})
export class TablaComunComponent implements OnInit{

  titulo = input<string>();
  columnsHeader=input<string[]>([],{alias:'cabeceros'});
  columnsBody=input<any[]>([],{alias:'info-tabla'});

  viewButton=input<boolean>(true,{alias:'viewButton'});
  viewButton2=input<boolean>(false,{alias:'viewButton2'});
  viewButton3=input<boolean>(false,{alias:'viewButton2'});
  viewButton4=input<boolean>(false,{alias:'viewButton2'});

  paginadorNumber=input<number>(0,{alias:'paginadorNumber'});

  p:number=1;


  public config: PaginationInstance = {
    id: 'paginador',
    itemsPerPage: this.paginadorNumber(),
    totalItems: this.columnsBody().length,
    currentPage: this.p
  };

  displayedColumns: string[] = [];
  pagedData: any[] = [];
  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  onChangeStatus= output<any[]>(); // data-row y segunda valor booleano
  onEdit = output<number>(); // data-row
  onDelete = output<number>(); // data-row
  onCreate = output<boolean>(); // flag para abrir modal
  onButton = output<boolean>(); // flag para abrir modal
  onConfirm = output<boolean>(); // flag para abrir modal
  onReProgram = output<boolean>(); // flag para abrir modal
  onFiles = output<boolean>(); // flag para abrir modal
  onChangePaged = output<number>(); // flag para abrir modal

  pageIndex:number=5;

  constructor(private cd:ChangeDetectorRef){
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
    const start = (this.p - 1) * this.paginadorNumber();
    const end = start + this.paginadorNumber();
    this.pagedData = this.columnsBody().slice(start, end);
  }

  handlePageChange(event:number) {
    this.p = event;
    this.onChangePaged.emit(event)
    this.updatePagedData();
  }

  emitButtonGeneral(data:any){
    this.onButton.emit(data);
  }

  emitEdit(data:any){
    this.onEdit.emit(data);
  }

  emitDelete(data:any){
    this.onDelete.emit(data);
  }

  emitStatus(data:any,valor:boolean){
    this.onChangeStatus.emit([data,valor]);
  }

  emitConfirm(data:any){
    this.onConfirm.emit(data);
  }
  emitReProfram(data:any){
    this.onReProgram.emit(data);
  }
  emitFiles(data:any){
    this.onFiles.emit(data);
  }

  emitCreate(flag:boolean){
    this.onCreate.emit(flag);
  }

}
