import { Component, Input, input, OnInit, output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { AuthService } from '@app/services/autenticacion/auth..service';
import { LoaderService } from '@app/services/loader/loader.service';
import { ModalService } from '@app/services/modal/modal.service';
import { PatientService } from '@app/services/pacientes/patient.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { BasicInputComponent } from '@app/shared/inputs/basic-input/basic-input.component';
import { IPacienteHis } from '@app/shared/interfaces/usuarios/paciente-his.model';
import { User } from '@app/shared/interfaces/usuarios/users.model';
import moment from 'moment';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-step-1',
  standalone: true,
  imports: [
    BasicInputComponent,
  ],
  templateUrl: './step-1.component.html',
  styleUrl: './step-1.component.scss'
})
export class Step1Component implements OnInit {

  @Input() form!:FormGroup;
  @Input() formParametros!:FormGroup;
  @Input() paciente!:IPacienteHis;

  onPaciente= output<IPacienteHis>();
  listaDocumentos:any[]=[];
  listaGeneros:any[]=[];

  constructor(
    private modalService:ModalService,
    private sharedService:SharedService,
    private loaderSvc:LoaderService,
    private pacienteService: PatientService,
    private authSvc:AuthService
  ){}

  async ngOnInit() {
    await this.getDocuments();
    await this.getBiologicalSex();

    let tokenDecoded = this.authSvc.decodeToken()
    if (tokenDecoded && tokenDecoded.IdPatient[1] && tokenDecoded.IdPatient[1] != "0") {
      await this.getPacienteById(tokenDecoded.IdPatient[1]);
    }
  }

  get formularioUser(){
    return this.form.value;
  }

  formFillPatient(){
    this.onPaciente.emit(this.paciente);
    this.paciente.birthDate = moment(this.paciente.birthDate,'DD/MM/YYYY').format('l');

    const filterIdentificationType = String(this.paciente.identificationNumber).split('-')[0];
    const documentType = this.listaDocumentos.find(x => String(x.documentType).includes(filterIdentificationType)).idDocumentType;
    const idBiologicalSex = this.listaGeneros.find(x => String(x.name).includes(this.paciente.biologicalSex)).id;
    this.form.get('idIdentificationType')?.setValue(documentType);
    this.form.get('identificationNumber')?.setValue(String(this.paciente.identificationNumber).split('-')[1]);
    this.form.get('name')?.setValue(this.paciente.patientName);
    this.form.get('lastName')?.setValue(this.paciente.patientLastNames);
    this.form.get('birthDate')?.setValue(this.paciente.birthDate);
    this.form.get('email')?.setValue(this.paciente.email);
    this.form.get('idBiologicalSex')?.setValue(idBiologicalSex);
    this.form.get('adress')?.setValue(this.paciente.address);
    this.form.get('phone')?.setValue(this.paciente.telephone);
    this.form.get('phone2')?.setValue(this.paciente.telephone2);
    if(this.formParametros){
      this.formParametros.get('idCity')?.setValue(this.paciente.city);
    }
  }

  async getPacienteById(idPaciente:string){
    this.loaderSvc.show();
    this.loaderSvc.text.set({ text: 'Cargando datos del paciente' });
    try {
      const resp =  await lastValueFrom(this.pacienteService.obtenerPacientePorId(idPaciente));

      if(resp.ok){
        this.paciente = resp.data;
        this.formFillPatient();
        this.form.get('idIdentificationType')?.disable({onlySelf:true});
        this.form.get('identificationNumber')?.disable({onlySelf:true});
      }
    } catch (error) {
      console.error(error);

      this.loaderSvc.hide();
    }

  }

  async getDocuments() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando tipos de documento...' })
      let documents = await  lastValueFrom(this.sharedService.documentsTypes());
      if (documents.data) {
        this.listaDocumentos = documents.data;
      }
      this.loaderSvc.hide();
    } catch (error) {
      this.loaderSvc.hide();
    }

  }

  async getBiologicalSex() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando tipos de género' })
      let biological = await lastValueFrom(this.sharedService.biologicalSex());
      if (biological.data) {
        this.listaGeneros = biological.data;
      }
      this.loaderSvc.hide();
    } catch (error) {
      this.loaderSvc.hide();
    }
  }

  async getPaciente(data:{idIdentificationType:number,identificationNumber:string}){
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando datos del paciente' });
      const resp =  await lastValueFrom(this.pacienteService.buscarPacientes("0","2",data));
      if(resp.ok){

        this.paciente = resp.data[0];
        this.formFillPatient();

      }else{
        this.form.get('identificationNumber')?.setValue(null);
        this.modalService.openStatusMessage('Cancelar','No se encontró información relacionada a los datos digitados','4')
      }
      this.loaderSvc.hide();
    } catch (error) {
      this.loaderSvc.hide();
      this.form.get('identificationNumber')?.setValue(null);
    }
  }

  obtenerDataInput(event:any){
    const identificationNumber = event.target.value;
    if(!this.formularioUser.idIdentificationType) {
      return this.modalService.openStatusMessage('Cancelar','Tipo de documento obligatorio','4')
    };
    if(!this.formularioUser.identificationNumber) {
      return this.modalService.openStatusMessage('Cancelar','Documento obligatorio','4')
    };
    const data = {
      idIdentificationType: this.formularioUser.idIdentificationType,
      identificationNumber
    }
    this.getPaciente(data);
  }

}
