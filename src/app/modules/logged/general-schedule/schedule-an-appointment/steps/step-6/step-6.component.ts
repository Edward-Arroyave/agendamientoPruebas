import { DatePipe } from '@angular/common';
import { Component, input, Input, OnInit, output, signal } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { FormatTimePipe } from '@app/pipes/format-time.pipe';
import { IProcemientoAgendarCita, ListDisponibilityAppointment } from '@app/shared/interfaces/agendar-cita/agendar-cita.interface';
import { nuevaListaExam } from '@app/shared/interfaces/exams-laboratory/exams-laboratory.model';

export interface VisualCardPaso6{
  iconName:string;
  categoryName:string;
  specialtiesName:string;
  specialConditionName?:string;
  elementName?:string;
  checked?:boolean
}

@Component({
  selector: 'app-step-6',
  standalone: true,
  imports: [
    MatIcon,
    DatePipe,
    FormatTimePipe,
    MatCheckboxModule
  ],
  templateUrl: './step-6.component.html',
  styleUrl: './step-6.component.scss'
})
export class Step6Component implements OnInit{

  @Input() listaRequerimientosConfimacion!:any[];
  @Input() listaAgendaSeleccionada!:ListDisponibilityAppointment[];
  @Input() procedimientoSelected!:IProcemientoAgendarCita;
  @Input() idTypeAttention!:number;
  @Input() fullName!:string;
  @Input() procedimientoPorAgendamiento!:VisualCardPaso6;
  @Input() observaciones!:string | null;
  associatedExam = input.required<boolean>();

  procedimientoPorAgendamientoEdited:any[]=[];
  onPreparaciones= output<any[]>();

  infoAdicional!:VisualCardPaso6;

  preparaciones:nuevaListaExam[]=[]

  constructor(){

  }

  ngOnInit(): void {
    this.listaRequerimientosConfimacion =this.listaRequerimientosConfimacion.map(x =>{
      x.checked = false;
      return x
    });

    if(this.procedimientoPorAgendamiento){
      this.infoAdicional = this.procedimientoPorAgendamiento;
    }else{
      this.infoAdicional={
        categoryName:this.procedimientoSelected.categoryName!,
        iconName:this.procedimientoSelected.iconName,
        specialConditionName:this.procedimientoSelected.specialConditionName!,
        specialtiesName:this.procedimientoSelected.specialtiesName!,
        elementName:this.procedimientoSelected.elementName
      }
    }
    this.getPreparaciones();
  }

  getPreparaciones(){
    if(this.associatedExam()){
      this.listaRequerimientosConfimacion.map(x =>{
        let obj:nuevaListaExam = {
          nombreExamn:x.examName,
          arrItems:[],
          checked:false,
          indications:x.indications,
          preconditions:x.preconditions,
        };
        if(x.listRequirements){
          obj.arrItems = x.listRequirements.map((listRequeriment:any) => listRequeriment.requirements);
        };
        this.preparaciones.push(obj);
      });
    }

    if(this.preparaciones.length > 0){
      this.onPreparaciones.emit(this.preparaciones);
    }else{
      this.onPreparaciones.emit(this.listaRequerimientosConfimacion);
    }
  }

  checkAndEmit(data:any[]){
    this.onPreparaciones.emit(data);
  }

}
