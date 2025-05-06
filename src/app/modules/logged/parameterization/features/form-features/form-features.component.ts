import { CommonModule, NgClass } from '@angular/common';
import { Component, ElementRef, HostListener, Renderer2 } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BasicInputComponent } from '../../../../../shared/inputs/basic-input/basic-input.component';
import { ToggleComponent } from '../../../../../shared/inputs/toggle/toggle.component';
import { LoaderService } from '../../../../../services/loader/loader.service';
import { ModalService } from '../../../../../services/modal/modal.service';
import { SharedService } from '../../../../../services/servicios-compartidos/shared.service';
import { EspecialidadesService } from '../../../../../services/parametrizacion/especialidades/especialidades.service';
import { FeaturesService } from '../../../../../services/parametrizacion/features/features.service';
import { Character } from '@app/shared/interfaces/parametrizacion/caracteristica.model';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { firstValueFrom, lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-form-features',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatTooltipModule,
    RouterLink,
    BasicInputComponent,
    ToggleComponent,
    NgClass,
  ],
  templateUrl: './form-features.component.html',
  styleUrl: './form-features.component.scss',
})
export class FormFeaturesComponent {
  especialidad: any[] = [];
  idCharacteristic: any;
  caracteristica: any;

  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();

  formCharacter = this.fb.group({
    idSpecialties: ['', [Validators.required]],
    characteristicName: ['', [Validators.required]],
    particularTime: [0],
  });

  tiempoObligatorio: boolean = false;

  constructor(
    private tzs: TrazabilidadService,
    private actRoute: ActivatedRoute,
    private features: FeaturesService,
    private fb: FormBuilder,
    private elRef: ElementRef,
    private renderer: Renderer2,
    private router: Router,
    private shadedSVC: SharedService,
    private especialidadesService: EspecialidadesService,
    private loaderSvc: LoaderService,
    private modalService: ModalService
  ) {
    this.idCharacteristic = this.actRoute.snapshot.params['idCharacteristic'];
  }

  async ngOnInit() {
    await this.getEspecialidad();
    if (this.idCharacteristic) {
      this.getCaracteristica(this.idCharacteristic);
    }
    this.filterEspecialdad();
  }

  trazabilidad(
    antes: Character,
    despues: Character | null,
    idMovimiento: number,
    movimiento: string
  ) {
    antes.specialtiesName = antes.specialtiesName;
    antes.characteristicName = antes.characteristicName;
    antes.fullNameUserAction = antes.fullNameUserAction;
    const dataTrazabilidad: dataTrazabilidad = {
      datos_actuales: antes,
      datos_actualizados: despues,
      idModulo: 11,
      idMovimiento,
      modulo: 'Parametrización',
      movimiento,
      subModulo: 'Caracteristicas',
    };
    this.tzs.postTrazabilidad(dataTrazabilidad);
  }

  async getCaracteristica(idCharacteristic: number): Promise<void> {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando característica' });

      const response = await firstValueFrom(
        this.features.getCharacter({ IdCharacteristic: idCharacteristic })
      );

      if (!response.ok || response.data === null) {
        this.modalService.openStatusMessage('Volver', `Ocurrió un error al obtener el detalle. ${response.message}`, '4');
        return;
      }

      const caracteristica = response.data[0];
      if (caracteristica) {
        this.caracteristica = caracteristica;
        this.formCharacter.patchValue({
          idSpecialties: caracteristica.idSpecialties || '',
          characteristicName: caracteristica.characteristicName || '',
          particularTime: caracteristica.particularTime || 0,
        });
      }

      this.loaderSvc.hide();
    } catch (error) {
      console.error('Error al cargar los datos de la característica:', error);
      this.loaderSvc.hide();
    }
  }

  filterEspecialdad() {
    this.fc.idSpecialties.valueChanges.subscribe((x) => {
      if (x) {
        this.validarObligatoriedadTiempo(x);
      }
    });
  }

  async getEspecialidad() {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando Especialidad' });
      let items = await this.especialidadesService
        .getSpecialization({})
        .toPromise();
      if (items.data) {
        this.especialidad = items.data;
      }
      this.loaderSvc.hide();
    } catch (error) {
      this.loaderSvc.hide();
    }
  }

  async save(): Promise<void> {
    if (this.formCharacter.invalid) {
      return;
    }
    if (this.tiempoObligatorio && (this.fv.particularTime == 0 || this.fv.particularTime == null)) {
      this.formCharacter.markAllAsTouched();
      this.modalService.openStatusMessage('Aceptar', 'Por favor ingrese el tiempo particular', '3')
      return;
    }

    const characterData = {
      ...this.formCharacter.value,
      idCharacteristic: this.idCharacteristic ? +this.idCharacteristic : 0,
      active: true,
      specialtiesName : this.especialidad.find(e => e.idSpecialties == this.fv.idSpecialties).specialtiesName,
      idUserAction: this.idUser,
      particularTime: this.formCharacter.get('particularTime')?.value || 0,
    };

    let antes;
    let despues;
    if (this.idCharacteristic) {
      const nuevoObj = {
        ...characterData,
        fullNameUserAction: this.nombreUsuario,
      };

      antes = this.caracteristica;
      despues = JSON.parse(JSON.stringify(nuevoObj));
      despues.active = this.caracteristica.active;
      despues.idUserAction = this.idUser;
      despues.fullNameUserAction = this.nombreUsuario;
      characterData.active = this.caracteristica.active;
    } else {
      const nuevoObj = {
        ...characterData,
        fullNameUserAction: this.nombreUsuario,
      };
      antes = JSON.parse(JSON.stringify(nuevoObj));
    }

    this.loaderSvc.show();
    try {
      const response = await this.features
        .saveCharacter(characterData)
        .toPromise();
      this.loaderSvc.hide();

      if (response?.ok) {
        const successMessage = `¡Caracteristica ${this.idCharacteristic ? 'actualizada' : 'agregada'} al sistema correctamente!`;
        await this.modalService.openStatusMessage('Aceptar', successMessage, '1');
        this.router.navigate(['/inicio/parametrizacion/caracteristicas']);
        this.idCharacteristic ? this.trazabilidad(antes,despues,2,'Edición'):this.trazabilidad(antes,null,1,'Creación');
      } else {
        this.modalService.openStatusMessage('Volver', response.message, '4');
      }
    } catch (error: any) {
      this.loaderSvc.hide();
      this.modalService.openStatusMessage('Volver', 'Ocurrió un error al procesar la solicitud.', '4');
    }
  }

  @HostListener('window:resize', ['$event'])
  Resolucion(event: any): void {
    setTimeout(() => {
      this.ajustarAlto();
    }, 100);
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
    this.router.navigate(['/inicio/parametrizacion/caracteristicas']);
  }

  get fv() {
    return this.formCharacter.value;
  }
  get fc() {
    return this.formCharacter.controls;
  }

  validarObligatoriedadTiempo(idSpecialties: any) {
    let especialidad = this.especialidad.find(
      (s) => s.idSpecialties == idSpecialties
    );
    if (especialidad && especialidad.isElementRequired) {
      this.tiempoObligatorio = false;
      this.fc.particularTime.clearValidators();
    } else {
      this.tiempoObligatorio = true;
      this.fc.particularTime.setValidators(Validators.required);
    }
    this.fc.particularTime.updateValueAndValidity();
    this.fc.particularTime.setValue(0);
  }
}
