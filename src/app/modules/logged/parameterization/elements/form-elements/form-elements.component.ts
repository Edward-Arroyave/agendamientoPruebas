import { AfterViewInit, Component, ElementRef, HostListener, Renderer2 } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LoaderService } from '../../../../../services/loader/loader.service';
import { ModalService } from '../../../../../services/modal/modal.service';
import { SharedService } from '../../../../../services/servicios-compartidos/shared.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BasicInputComponent } from '../../../../../shared/inputs/basic-input/basic-input.component';
import { FeaturesService } from '../../../../../services/parametrizacion/features/features.service';
import { ElementsService } from '../../../../../services/parametrizacion/elements/elements.service';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { lastValueFrom, retry } from 'rxjs';
import { Elementos } from '@app/shared/interfaces/parametrizacion/elementos.model';
import { Character } from '@app/shared/interfaces/parametrizacion/caracteristica.model';
import { ExamsLaboratoryService } from '@app/services/exams-laboratory/exams-laboratory.service';
import { GetExam } from '@app/shared/interfaces/exams-laboratory/exams-laboratory.model';
import { MercadoPagoService } from '@app/services/mercado-pago/mercado-pago.service';
import { IGetInstCode, IInstCode } from '@app/shared/interfaces/payment-gateway/payment-gateway.model';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-form-elements',
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatTooltipModule,
    BasicInputComponent
  ],
  templateUrl: './form-elements.component.html',
  styleUrl: './form-elements.component.scss',
})
export class FormElementsComponent implements AfterViewInit {
  caracteristica: Character[] = [];
  examenes: GetExam[] = [];
  listInstCode: IGetInstCode[] = [];
  CondicionEspecial: any[] = [];
  documentsTypes: any[] = [];
  idElement: string | null = null;
  arr: number[] = [];
  listInternalCodes: any[] = [];
  listExamsCups: any[] = [];

  formElementos = this.fb.group({
    idCharacteristic: ['', [Validators.required]],
    elementName: ['', [Validators.required]],
    particularTime: [0],
    idSpecialCondition: ['', [Validators.required]],
    listIdExamArr: [this.arr, []],
    cups: ['', [Validators.required]],
    internalCode: ['', [Validators.required]],
    observations: ['', [Validators.required]],
  });
  element: any;
  tiempoObligatorio: boolean = false;
  examenesLaboratorioFlag: boolean | undefined = false;
  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();

  blockExams: boolean = false;

  currentContracts: any[] = []

  constructor(
    private actRoute: ActivatedRoute,
    private fb: FormBuilder,
    private elRef: ElementRef,
    private renderer: Renderer2,
    private router: Router,
    private features: FeaturesService,
    private shadedSVC: SharedService,
    private loaderSvc: LoaderService,
    private elementService: ElementsService,
    private modalService: ModalService,
    private tzs: TrazabilidadService,
    private examService: ExamsLaboratoryService,
    private mercadoPagoService: MercadoPagoService
  ) {
    this.idElement = this.actRoute.snapshot.params['idElement'];
  }

  async ngOnInit() {
    await this.observarCups();
    this.filterCaracteristica();
    this.observarFormulario();
    if (this.idElement) {
      await this.loadElementData(this.idElement);
    }
  }

  async ngAfterViewInit() {
    await this.getCaracteristica();
    await this.getCondicionEspecia();
    await this.getCups();
    this.ajustarAlto();
  }


  async observarInstCode(cups: string) {
    if (!cups) {
      return
    }
    if (this.examenesLaboratorioFlag) return;
    const data: IInstCode = {
      cups
    }
    this.loaderSvc.show();
    this.loaderSvc.text.set({ text: 'Cargando códigos internos' });
    try {

      let x = await lastValueFrom(this.mercadoPagoService.obtenerInstCode(data))

      this.loaderSvc.hide();
      if (x.ok) {
        this.listInstCode = JSON.parse(x.data).data;
        this.listInstCode = this.listInstCode.map(x => {
          x.fullValue = x.fullValue = `${x.instServiceCode} - ${x.instServiceName}`;
          return x
        });
        this.formElementos.get('internalCode')?.setValidators([Validators.required]);
        this.formElementos.updateValueAndValidity();
        // if (this.currentCodes && this.currentCodes.length) {
        //   this.listInstCode = this.listInstCode.map(s => {
        //     if (this.currentCodes.includes(s.instServiceCode)) {
        //       s.checked = true;
        //     }
        //     return s
        //   })
        //   this.fc.internalCode.setValue(this.currentCodes);
        //   this.currentCodes = [];
        // }
        this.loaderSvc.hide();
        return;
      }
      this.modalService.openStatusMessage('Cancelar', 'No se encontrarón códigos internos', '4')
      this.listInstCode = [];
      this.formElementos.get('internalCode')?.clearValidators();
      this.formElementos.updateValueAndValidity();
      this.loaderSvc.hide();
      this.loaderSvc.hide();
    } catch (error) {

      this.loaderSvc.hide();
    }
    this.loaderSvc.hide();
  }

  async obtenerCostoExamen(valorCups: string) {
    try {
      if (this.examenesLaboratorioFlag) return;
      this.loaderSvc.show();
      const costo = await lastValueFrom(this.mercadoPagoService.obtenerCostoExamen("NULL", valorCups, ""));
      if (!costo.ok) {
        this.modalService.openStatusMessage("cancelar", 'No existe costo para el examen, recuerde que se puede generar costos si el paciente es particular', '3');
      }
      const respuesta = JSON.parse(costo.data).data;
      this.loaderSvc.hide();
      return respuesta;
    } catch (error) {
      this.loaderSvc.hide();
      return [];
    }
  }

  async observarCups() {
    this.formElementos.get('cups')?.valueChanges.subscribe(async x => {
      this.formElementos.get('internalCode')?.setValue('');
      // await this.obtenerCostoExamen(x!);
      await this.observarInstCode(x!);
    })
  }



  observarFormulario() {
    this.formElementos.get('idCharacteristic')?.valueChanges.subscribe(x => {
      if (x) {
        this.examenesLaboratorioFlag = this.caracteristica.find(y => y.idCharacteristic === Number(x))?.associatedExam;
        if (this.examenesLaboratorioFlag) {
          this.getExamenes();
          this.formElementos.get('idExam')?.setValidators([Validators.required]);
          this.formElementos.get('cups')?.clearValidators();
          this.formElementos.get('internalCode')?.clearValidators();
        } else {
          this.examenes = [];
          this.formElementos.get('idExam')?.clearAsyncValidators();
          this.formElementos.get('cups')?.setValidators([Validators.required]);
          this.formElementos.get('internalCode')?.setValidators([Validators.required]);
        }
        this.formElementos.updateValueAndValidity();
      }
    })
  }

  filterCaracteristica() {
    this.fc.idCharacteristic.valueChanges.subscribe((x) => {
      if (x) {
        this.validarObligatoriedadTiempo(x);
        this.formElementos.get('particularTime')?.setValue(0);
        this.formElementos.get('idSpecialCondition')?.setValue('');
        this.formElementos.get('listIdExamArr')?.setValue([]);
        this.formElementos.get('cups')?.setValue('');
        this.formElementos.get('internalCode')?.setValue('');
      }
    });
  }

  trazabilidad(antes: any, despues: any | null, idMovimiento: number, movimiento: string) {
    const dataTrazabilidad: dataTrazabilidad = {
      datos_actuales: antes,
      datos_actualizados: despues,
      idModulo: 11,
      idMovimiento,
      modulo: "Parametrización",
      movimiento,
      subModulo: "Elementos"
    }
    this.tzs.postTrazabilidad(dataTrazabilidad);
  }

  async getExamenes() {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando examenes' })
      const resp = await lastValueFrom(this.examService.getAllExam());
      if (resp.ok) {
        this.examenes = resp.data;
        if (this.idElement && this.element.exams) {
          const listaExamenes: string[] = String(this.element.exams).split(',');

          this.examenes = this.examenes.map(x => {
            if (listaExamenes.includes(String(x.idExam))) {
              return { ...x, checked: true, disabled: this.blockExams ? true : false };
            }
            return { ...x, checked: false };
          });

          this.fc.listIdExamArr.setValue(listaExamenes.map(x => Number(x)));
        } else {
          this.examenes = this.examenes.map(x => { return { ...x, checked: false } })
        }
      } else {
        this.modalService.openStatusMessage('Cancelar', resp.message, '4');
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
      this.modalService.openStatusMessage('Cancelar', 'Lo sentimos ha ocurrido un error', '4')
    }
  }

  async loadElementData(idElement: string): Promise<void> {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando elementos' });

      // Obtener lista filtrando solo por idElement
      let response = await lastValueFrom(
        this.elementService.getElementos({ idElement: idElement })
      );

      if (response.data) {
        let elementData: Elementos = {} as Elementos;
        if (Array.isArray(response.data)) {
          elementData = response.data[0];
          this.blockExams = false
        } else {
          elementData = response.data
          if (elementData.desactiveExams === false) this.blockExams = true
        }
        if (elementData) {
          this.element = elementData;

          this.fc.idCharacteristic.setValue(String(elementData.idCharacteristic));
          this.fc.elementName.setValue(elementData.elementName);
          this.fc.idSpecialCondition.setValue(String(elementData.idSpecialCondition));
          this.fc.observations.setValue(elementData.observations);
          this.fc.particularTime.setValue(elementData.particularTime);
          this.fc.cups.setValue(elementData.cups);

          if (elementData.cups) {
            if (elementData.listElementContracts && elementData.listElementContracts.length) {
              this.currentContracts = elementData.listElementContracts
              this.fc.internalCode.setValue(elementData.internalCode);
            } else {
              this.fc.internalCode.setValue('');

            }
          }


          this.loaderSvc.hide();

        } else {
          this.loaderSvc.hide();
          console.error('Elemento no encontrada.');
        }
      }
      this.loaderSvc.hide();
    } catch (error) {
      console.error('Error al cargar los datos de la elementos:', error);
      this.loaderSvc.hide();
    }
  }

  //Traer cups
  async getCups() {
    try {

      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando listado de CUPS' });
      let cupsData = await lastValueFrom(this.examService.getListCups());
      if (cupsData.ok && cupsData.data.length) {
        let cups = [];
        for (let i = 0; i < 50; i++) {
          cups.push(cupsData.data[i])
        }
        //this.listExamsCups = cups.map((exam: any) => {
        this.listExamsCups = cupsData.data.map((exam: any, index: number) => {
          let codename = exam.code + " - " + exam.name;
          return {
            codename: codename,
            code: exam.code,
            idService: exam.idService,
          }
        });
        this.loaderSvc.hide();
      } else {
        this.modalService.openStatusMessage('Cerrar', 'Error al trear el listado de CUPS', '4')
      }



    } catch (error) {
      this.loaderSvc.hide();
      this.modalService.openStatusMessage('Cerrar', 'Error al trear el listado de CUPS', '4')
    }
  }

  async save(): Promise<void> {

    if (this.formElementos.invalid) {
      this.formElementos.markAllAsTouched();
      return;
    }
    if (this.tiempoObligatorio && (this.fv.particularTime == 0 || this.fv.particularTime == null)) {
      this.formElementos.markAllAsTouched();
      this.modalService.openStatusMessage('Aceptar', 'Por favor ingrese el tiempo particular', '3')
      return;
    }

    if (this.examenesLaboratorioFlag && this.formElementos.get('listIdExamArr')?.value) {

      if (this.formElementos.get('listIdExamArr')?.value?.length == 0) {
        this.formElementos.markAllAsTouched();
        this.modalService.openStatusMessage('Aceptar', 'Por favor ingrese los exámenes correspondientes', '3')
        return;
      }

    }
    this.loaderSvc.show();

    try {
      let examenes: any[] = this.formElementos.get('listIdExamArr')?.value!

      //Generacion de codigos internos con para lista
      let listElementContracts: any[] = [];

      if (this.formElementos.get('internalCode')?.value) {
        listElementContracts = this.createListContracts();
      }
      const elementData = {
        ...this.formElementos.value,
        listIdExam: examenes.join(','),
        idElement: this.idElement ? +this.idElement : 0,
        active: true,
        idUserAction: this.shadedSVC.obtenerIdUserAction(),
        particularTime: this.formElementos.get('particularTime')?.value || 0,
        characteristicName: this.caracteristica.find(e => e.idCharacteristic === Number(this.fv.idCharacteristic))?.characteristicName,
        specialConditionName: this.CondicionEspecial.find(e => e.idSpecialCondition == this.fv.idSpecialCondition).specialConditionName,
        listElementContracts: listElementContracts,
        cups: !this.examenesLaboratorioFlag ? this.formElementos.get('cups')?.value || '' : '',
      };
      let r = await lastValueFrom(
        this.elementService.saveElementos(elementData)
      );
      this.loaderSvc.hide();
      if (r.ok) {
        const successMessage = `¡Elemento ${this.idElement ? 'actualizado' : 'agregado'} al sistema correctamente!`;
        this.modalService.openStatusMessage('Aceptar', successMessage, '1');
        this.router.navigate(['/inicio/parametrizacion/elementos']);
        this.trazabilidadGuardarEditar(elementData);

      } else {
        this.modalService.openStatusMessage('Aceptar', r.message, '3');
      }
    } catch (error) {
      this.loaderSvc.hide();
      this.modalService.openStatusMessage('Volver', 'Ocurrió un error al procesar la solicitud.', '4');
    }
  }


  //funcionalidad para generar el listado de contratos
  createListContracts() {
    let listElementContracts = [];
    let arregloCodigos: any = this.formElementos.get('internalCode')?.value;

    if (arregloCodigos && arregloCodigos.length) {

      let item: any = this.listInstCode.find(e => e.instServiceCode == arregloCodigos)
      if (item.contracts && item.contracts.length) {
        for (const contrato of item.contracts) {
          let idElementContract = 0;
          let id = this.currentContracts.find(e => e.contracts == contrato.contractCode);
          if (id) {
            idElementContract = id.idElementContract;
          }
          let objContract = {
            idElementContract: idElementContract,
            contracts: contrato.contractCode
          };
          listElementContracts.push(objContract);
        }
      }
    }

    return listElementContracts;
  }

  async getCaracteristica() {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando caracteristicas' });
      let items = await lastValueFrom(this.features.getCharacter({}));
      if (items.data) {
        this.caracteristica = items.data;
      }
      this.loaderSvc.hide();
    } catch (error) {
      this.loaderSvc.hide();
    }
  }

  async getCondicionEspecia() {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando caracteristicas' });
      let items = await lastValueFrom(this.elementService.getCondicionEspecial({}));
      if (items.data) {
        this.CondicionEspecial = items.data;
      }
      this.loaderSvc.hide();
    } catch (error) {
      this.loaderSvc.hide();
    }
  }

  @HostListener('window:resize', ['$event'])
  Resolucion(event: any): void {
    setTimeout(() => {
      this.ajustarAlto();
    }, 100);
  }

  get fv() {
    return this.formElementos.value;
  }
  get fc() {
    return this.formElementos.controls;
  }

  private ajustarAlto() {
    const container =
      this.elRef.nativeElement.querySelector('.container').offsetHeight;
    const header =
      this.elRef.nativeElement.querySelector('.title-form').offsetHeight;
    let he = container - header - 100;
    this.renderer.setStyle(
      this.elRef.nativeElement.querySelector('.form'),
      'height',
      `${he}px`
    );
  }

  cancelar() {
    this.router.navigate(['/inicio/parametrizacion/elementos']);
  }

  validarObligatoriedadTiempo(idCharacteristic: any) {
    let caracteristica = this.caracteristica.find(
      (s) => s.idCharacteristic == idCharacteristic
    );
    if (caracteristica && caracteristica.isElementRequired) {
      this.tiempoObligatorio = true;
      this.fc.particularTime.setValidators(Validators.required);
    } else {
      this.tiempoObligatorio = false;
      this.fc.particularTime.clearValidators();
    }
    this.fc.particularTime.updateValueAndValidity();
    this.fc.particularTime.setValue(0)
  }

  trazabilidadGuardarEditar(nuevoElemento: any) {

    //Elemento para trazabilidad//
    let antes;
    let despues;
    let a = this.element;
    let d = nuevoElemento
    if (this.idElement) {

      antes = {
        elementName: a.elementName,
        particularTime: a.particularTime,
        characteristicName: a.characteristicName,
        specialConditionName: a.specialConditionName,
        observations: a.observations,
        active: a.active,
        fullNameUserAction: a.fullNameUserAction,
        idUserAction: a.idUserAction,
        internalCode: a.internalCode,
        cups: a.cups
      }
      despues = {
        elementName: d.elementName,
        particularTime: d.particularTime,
        characteristicName: d.characteristicName,
        specialConditionName: d.specialConditionName,
        observations: d.observations,
        active: d.active,
        cups: a.cups,
        internalCode: a.internalCode,
        fullNameUserAction: this.nombreUsuario,
        idUserAction: this.idUser,
      }

    } else {

      antes = {
        elementName: d.elementName,
        particularTime: d.particularTime,
        characteristicName: d.characteristicName,
        specialConditionName: d.specialConditionName,
        observations: d.observations,
        active: d.active,
        fullNameUserAction: this.nombreUsuario,
        idUserAction: this.idUser,
      }
    }



    this.idElement ? this.trazabilidad(antes, despues, 2, 'Edición') : this.trazabilidad(antes, null, 1, 'Creación');
  }
}
