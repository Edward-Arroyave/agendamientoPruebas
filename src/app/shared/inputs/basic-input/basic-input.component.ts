import { Component, forwardRef, Input, signal, input, ViewChild, ElementRef, AfterContentInit, OnInit, inject, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { FieldErrors } from '../../globales/getFieldError';
import { CommonModule, NgClass } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInput } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';

import { registerLocaleData } from '@angular/common';
import localeES from "@angular/common/locales/es";
import moment from 'moment';
import 'moment/locale/es';
import { SelectInputComponent } from '../select-input/select-input.component';
import { ModalService } from '../../../services/modal/modal.service';
import { OnlyDirective } from '../../directivas/only.directive';
import { take } from 'rxjs';
import { IconosService } from '@app/services/registro-iconos/iconos.service';

moment.locale('es');
registerLocaleData(localeES, "es");

@Component({
  selector: 'app-basic-input',
  standalone: true,
  imports: [NgClass,
    ReactiveFormsModule,
    MatIcon,
    MatDatepickerModule,
    MatInput,
    MatNativeDateModule,
    SelectInputComponent,
    OnlyDirective,
    CommonModule
  ],
  templateUrl: './basic-input.component.html',
  styleUrl: './basic-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BasicInputComponent),
      multi: true
    },
    MatDatepickerModule
  ]
})
export class BasicInputComponent implements AfterContentInit, OnInit, OnChanges {

  @ViewChild('btnFile') btnFile!: ElementRef<HTMLInputElement>;


  // requerido para funcioar con reactive forms
  @Input() form!: FormGroup;
  @Input() nameControlform!: string;
  @Input() nameControlform2!: string;
  @Input() textLabel!: string;

  // iconos de inputs y tipo
  @Input() typeInput!: string;
  @Input() rightIcon!: string;
  @Input() leftIcon!: string;

  // input textarea
  @Input() rows: number = 1;
  @Input() cols: number = 50;
  @Input() index?: number;

  //Inputs en date
  @Input() minDate: Date | null = null;
  @Input() maxDate: Date | null = null;
  @Input() daysBlocked: string[] = [];

  //Inmput text length
  @Input() maxlength: number | null = null;
  // input time
  formattedTime: string | null = null;
  timeValue: number = 0;

  //input time 2 con horas
  formattedTimeInHours: string = '00:00';
  intervalId: any; // Almacena el ID del intervalo

  // informacion necesaria para selects
  isOpen = false;
  @Input() dataSelect!: any[];
  @Input() valueId!: string;
  @Input() valueDescription!: string;
  @Input() flagCheck: boolean = false;
  @Input() placeholderText: string = ''
  @Input() searchFlag: boolean = false;

  // para cuando existe el nombre del archivo
  @Input() restriction!: string;

  // necesario para mostrar errores y permitir paso a cierto archivos
  @Input() extensionesPermitidas!: string[];
  @Input() nameFileExist!: string;

  //Desactivacion de input, aplicado para tiempo
  @Input() disabled: boolean = false;
  dateFilter!: (date: Date | null) => boolean;

  isLeftIconRegistered: boolean = false;
  isRightIconRegistered: boolean = false;

  validator: ValidatorFn = Validators.required;

  @Output() blurInput: EventEmitter<any> = new EventEmitter<any>;

  nameFile = signal<string>('');
  eyeVisibility = signal<string>('visibility');
  requireFlag = signal<boolean>(true);
  fieldError = new FieldErrors();

  // Inyección de dependencias
  private _iconCustomService = inject(IconosService)

  constructor(private modalService: ModalService) {
  }

  ngOnInit() {
    this.validateIconsSvg();
    const timeControls = ['particularTime', 'maximumTime'];
    if (timeControls.includes(this.nameControlform)) {
      const initialValue = this.form.get(this.nameControlform)?.value;
      if (initialValue) {
        this.timeValue = parseInt(initialValue, 10);
        this.formatTime();
      }

      this.form.get(this.nameControlform)?.valueChanges
        .pipe(take(1))
        .subscribe(value => {
          this.timeValue = parseInt(value, 10);
          this.formatTime();
        });
    }

    if (
      this.nameControlform === 'startTime' ||
      this.nameControlform === 'fromInter' ||
      this.nameControlform === 'endTime' ||
      this.nameControlform === 'untilInter' ||
      this.nameControlform === 'endInter'
    ) {
      this.form.get(this.nameControlform)?.valueChanges.subscribe(value => {
        this.formattedTimeInHours = value;
      });
    }


  }

  ngOnChanges(changes: SimpleChanges): void {
    const initialValue = this.form.get(this.nameControlform)?.value;
    if (initialValue) this.nameFile.set('Cargado');
    if (this.nameControlform === "birthDate") {
      // console.log(changes);
    }
    if(this.typeInput == 'date')    this.updateDateFilter();

  }

  ngAfterContentInit() {
    this.form.get(this.nameControlform)?.hasValidator(Validators.required) ? this.requireFlag.set(true) : this.requireFlag.set(false);
    if (this.nameFileExist) this.nameFile.set(this.nameFileExist)
  }

  increaseTime() {
    this.adjustTime(5);
  }

  decreaseTime() {
    if (this.timeValue === 0) return
    this.adjustTime(-5);
  }

  increaseHour() {
    this.formatHour(1);
    this.startInterval(1);
  }

  decreaseHour() {
    this.formatHour(-1);
    this.startInterval(-1);
  }

  startInterval(action: number) {
    // Inicia el intervalo que repetirá la acción cada 200ms (puedes ajustar este valor)
    this.intervalId = setInterval(() => {
      this.formatHour(action);
    }, 100);
  }

  stopInterval() {
    // Detiene el intervalo
    clearInterval(this.intervalId);
  }


  private adjustTime(amount: number) {
    this.timeValue = Number(this.timeValue) + amount;
    if (this.timeValue < 0) this.timeValue = 0;
    this.formatTime();
  }

  private validateIconsSvg(): void {
    // Validar si los iconos a usar se encuentran registrados dentro de los Svg personalizados.
    this.isLeftIconRegistered = this._iconCustomService.isIconRegistered(this.leftIcon);
    this.isRightIconRegistered = this._iconCustomService.isIconRegistered(this.rightIcon);
  }

  // Formatea el tiempo y muestra horas si es mayor a 60 minutos ya
  formatTime() {

    if (this.timeValue === 0) {
      this.formattedTime = null;
      this.form.get(this.nameControlform)?.setValue('');
      return;
    }

    const hours = Math.floor(this.timeValue / 60);
    const minutes = this.timeValue % 60;


    if (hours > 0) {
      this.formattedTime = hours + ' ' + (hours === 1 ? 'hora' : 'horas');
      if (minutes > 0) {
        this.formattedTime += ` ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
      }
    } else {
      this.formattedTime = `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    }

    // Convertir el valor a minutos antes de enviarlo al formulario
    const totalMinutes = (hours * 60) + minutes;
    this.form.get(this.nameControlform)?.setValue(totalMinutes);
  }


  formatHour(action: number) {

    let currentTime = this.formattedTimeInHours;
    let [hours, minutes] = currentTime.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;
    totalMinutes += action === 1 ? 15 : -15;
    if (totalMinutes < 0) {
      totalMinutes = 1440 + totalMinutes;
    } else if (totalMinutes >= 1440) {
      totalMinutes = totalMinutes % 1440;
    }
    let newHours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    let newMinutes = (totalMinutes % 60).toString().padStart(2, '0');

    currentTime = `${newHours}:${newMinutes}`;
    this.formattedTimeInHours = currentTime;

    this.form.get(this.nameControlform)?.setValue(currentTime);
  }


  openModalStatus(btn: string, mensaje: string, type: string) {
    this.modalService.openStatusMessage(btn, mensaje, type)
  }

  changePassToText() {
    if (this.typeInput === 'password') {
      this.typeInput = 'text';
      this.eyeVisibility.set('visibility_off');
    } else {
      this.typeInput = 'password';
      this.eyeVisibility.set('visibility');
    }
  }

  getCurrentDate() {
    setTimeout(() => {
      const element = document.querySelector('.mat-calendar-header') as HTMLElement;
      if (element) {
        element.style.setProperty('--current_date', `'${moment().format('DD MMMM YYYY, h:mm:ss a')}'`);
      }
    }, 100);
  }


  onInput() {
    const elementId = 'inputBase' + this.nameControlform + (this.index !== undefined ? this.index : '');
    const element = document.getElementById(elementId) as HTMLInputElement;
    if (element) {
      (this.typeInput === 'file' || this.typeInput === 'select') ? element.click() : element.focus();
    }
    if (this.typeInput === 'select') {
      this.isOpen = true;
    }
  }


  onChageFile(evento: any) {
    this.handleFile(evento.target.files[0]);
  }

  openPicker(picker: any) {
    if (!this.disabled) {
      picker.open();
      this.getCurrentDate();
    }
  }
  private updateDateFilter(): void {
    this.dateFilter = (date: Date | null): boolean => {
      if (!date) return false;
      return !this.daysBlocked.some(blockedDate =>
        blockedDate.toString() == date.toString()
      );
    };
  }

  private handleFile(file: File) {
    let base64FileData: string | null;
    if (!this.extensionesPermitidas.includes(file.name.split('.')[1])) {
      this.openModalStatus('Volver', `¡¡ Extensión no permitida (permitidas ${this.extensionesPermitidas.slice().join(',')}) !!`, '4');
      return
    }
    this.nameFile.set(file.name);
    // Convertir archivo a base64
    const reader = new FileReader();
    reader.onload = (e) => {
      base64FileData = (e.target?.result as string) || null;
      this.form.get(this.nameControlform)?.setValue(String(base64FileData).split(',')[1]);
      // Aquí puedes realizar otras acciones con la cadena base64 TODO:emitir
    };
    reader.onerror = (error) => {
      this.openModalStatus('Volver', '¡¡ Error al leer el archivo: !!', '4');
    };
    reader.readAsDataURL(file); // Lee el archivo y lo convierte a base64
  }

}
