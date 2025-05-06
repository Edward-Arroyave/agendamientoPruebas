import { Component, ElementRef, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalService } from '../../../services/modal/modal.service';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { ModalData } from '../../../shared/globales/Modaldata';
import { ModalGeneralComponent } from '../../../shared/modals/modal-general/modal-general.component';
import { TablaComunComponent } from '../../../shared/tabla/tabla-comun/tabla-comun.component';
import { MatIcon } from '@angular/material/icon';
import { CommonModule, NgClass } from '@angular/common';
import { BasicInputComponent } from '../../../shared/inputs/basic-input/basic-input.component';
import { ToggleComponent } from '../../../shared/inputs/toggle/toggle.component';
import { FileInputComponent } from '../../../shared/inputs/file-input/file-input.component';
import { environment } from '../../../../environments/environment.development';
import { EmailService } from '@app/services/email/email.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-ejemplos',
  standalone: true,
  imports: [
    CommonModule,
    TablaComunComponent,
    MatIcon,
    ReactiveFormsModule,
    BasicInputComponent,
    ToggleComponent,
    FileInputComponent],
  templateUrl: './ejemplos.component.html',
  styleUrl: './ejemplos.component.scss'
})
export class EjemplosComponent {


  @ViewChild('btnFile') btnFile!: ElementRef<HTMLDivElement>;

  currentTheme: string = 'light-theme'; // Valor por defecto
  correoHTML: SafeHtml = '';
  data = {
    nombre: 'Juan Carlos Torres Pardo',
    fecha: 'Lunes 09 de septiembre 2024',
    hora: '9:00 AM',
    categoria: 'Imágenes diagnósticas',
    especialidad: 'RM - Resonancia',
    caracteristica: 'Equipo de Rayos X Máximo contraste',
    elemento: '7005 - Resonancia magnética de articulación temporomandibular',
    condicionEspecial: 'Contraste',
    tipoAtencion: 'Presencial',
    sala: 'Sala #1',
    sede: 'Centro Hospitalario Laboratorio Colcan',
    mapa: 'https://maps.link',
  };
  datax = [
    { quesoId: '10110', descripQueso: 'Prueba 1', checked: false },
    { quesoId: '2020', descripQueso: 'Prueba 2', checked: false },
    { quesoId: '3030', descripQueso: 'Prueba 3', checked: false },
    { quesoId: '4040', descripQueso: 'Prueba 5', checked: false },
    { quesoId: '5040', descripQueso: 'Prueba 6', checked: false },
    { quesoId: '6040', descripQueso: 'Prueba 7', checked: false },
    { quesoId: '7040', descripQueso: 'Prueba 8', checked: false },
    { quesoId: '8040', descripQueso: 'pan', checked: false },
  ];

  extensionesPermitidas: string[] = ['png', 'jpg'];

  // inputs
  form: FormGroup = this.fb.group({
    prueba1: ['', [Validators.required, Validators.minLength(3)]],
    prueba2: ['', [Validators.required, Validators.minLength(3)]],
    prueba3: ['', [Validators.required, Validators.minLength(3)]],
    select1: ['', [Validators.required]],
    select2: ['', [Validators.required]],
    select3: ['', [Validators.required]],
    file: ['', [Validators.required]],
  })
  constructor( private renderer: Renderer2, private el: ElementRef, private sanitizer: DomSanitizer,private emailService: EmailService, private fb:FormBuilder,private modalService:ModalService,private dialog:MatDialog){
  }
  // inputs

  setTheme(theme: any) {
    document.body.classList.remove(`${this.currentTheme}-theme`);
    document.body.classList.add(`${theme}-theme`);
    this.currentTheme = theme;
  }

  openModalStatus(btn: string, mensaje: string, type: string) {
    this.modalService.openStatusMessage(btn, mensaje, type)
  }

  openModalCustomed(template: TemplateRef<any>, titulo: string = '', mensaje: string = '') {
    const destroy$: Subject<boolean> = new Subject<boolean>();
    /* Variables  recibidas por el modal */
    const data: ModalData = {
      content: template,
      btn: 'Guardar',
      btn2: 'Cerrar',
      footer: true,
      title: titulo,
      message: mensaje,
      image: ''
    };
    const dialogRef = this.dialog.open(ModalGeneralComponent, { height: 'auto', width: '40em', data, disableClose: true });

    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(x => {
      dialogRef.close();
    });
  }


  mostrarVistaPrevia() {
    // Genera la vista previa del correo
    const htmlString = this.emailService.generatePreview('cita-confirmada', this.data);

    // Limpia/Asegura el HTML para que Angular lo trate como seguro
    this.correoHTML = this.sanitizer.bypassSecurityTrustHtml(htmlString);
  }

  enviarCorreo() {
    this.emailService.sendEmail('cita-reservada', this.data).subscribe(
      response => {
        console.log('Correo enviado exitosamente:', response);
      },
      error => {
        console.error('Error al enviar el correo:', error);
      }
    );
  }
}
