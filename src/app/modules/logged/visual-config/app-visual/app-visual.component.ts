import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalService } from '@app/services/modal/modal.service';
import { BasicInputComponent } from '@app/shared/inputs/basic-input/basic-input.component';
import { FileInputComponent } from '@app/shared/inputs/file-input/file-input.component';
import { ChangeThemeService } from '../../../../services/cambio-tema/change-theme.service';
import { ConfiguracionVisualService } from '../../../../services/configuracion-visual/configuracion-visual';
import { lastValueFrom } from 'rxjs';
import { configVisual } from '@app/shared/interfaces/configuracion-visual/config-visual';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { LoaderService } from '@app/services/loader/loader.service';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';

@Component({
  selector: 'app-app-visual',
  standalone: true,
  imports: [FileInputComponent, BasicInputComponent],
  templateUrl: './app-visual.component.html',
  styleUrl: './app-visual.component.scss'
})
export class AppVisualComponent implements OnInit, OnDestroy {

  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();

  colores: any[] = [];
  tipoGrafia: any[] = [];

  dataConfigVisual!: any | configVisual;
  themeOriginal: string = "";
  tipografiaOriginal: string = "";

  form: FormGroup = this.fb.group({
    idVisualConfiguration: [0, []],
    titleEntry: [, [Validators.required]],
    textEntry: [, [Validators.required]],
    fileLoad: [, [Validators.required]],
    colorPalette: [, [Validators.required]],
    idTypography: [, [Validators.required]],
    typography: [, [Validators.required]],
    dataProcessing: [, [Validators.required]],
    mainLogo: [, [Validators.required]],
    logoFavicon: [, [Validators.required]],
    logoFooter: [, [Validators.required]],
    idUserAction: [this.shadedSVC.obtenerIdUserAction(), [Validators.required]],
    primaryColor: [, [Validators.required]],
    secondaryColor: [, [Validators.required]],
    tertiaryColor: [, [Validators.required]],
    fourthColor: [, [Validators.required]],
  });


  constructor(private fb: FormBuilder,
    private modalService: ModalService,
    private changeThemeService: ChangeThemeService,
    private cvs: ConfiguracionVisualService,
    private shadedSVC: SharedService,
    private loader: LoaderService,
    private tzs: TrazabilidadService,
  ) {
    this.form.get('colorPalette')?.valueChanges.subscribe(x => {
      this.cambiarTheme(x);
      let colores: any[] = this.changeThemeService.getColorPrimarySecundarytertiary(x);
      if (colores.length !== 0) {
        this.fc['primaryColor'].setValue(colores[0]);
        this.fc['secondaryColor'].setValue(colores[1]);
        this.fc['tertiaryColor'].setValue(colores[2]);
        this.fc['fourthColor'].setValue(colores[3]);
      }
    })
    this.form.get('idTypography')?.valueChanges.subscribe(x => {
      let tipo = this.tipoGrafia.filter(z => z.idTipografia === x)[0];
      if(tipo){
        this.cambiarFuente(tipo.nomTipoGrafia);
        this.fc['typography'].setValue(tipo.nomTipoGrafia);
      }
    })
  }
  ngOnDestroy(): void {
    const fuente = this.tipoGrafia.filter((x: any) => x.idTipografia === this.tipografiaOriginal)[0].nomTipoGrafia;
    sessionStorage.setItem('color', this.themeOriginal);
    sessionStorage.setItem('tipografia', fuente);
    this.cambiarFuente(fuente);
  }

  ngOnInit(): void {
    this.getConfiguracion();
    this.tipoGrafia = this.changeThemeService.tipoGrafia;
    this.colores = this.changeThemeService.themeNames;
  }

  trazabilidad(antes:configVisual,despues:configVisual | null,idMovimiento:number,movimiento:string){
    const dataTrazabilidad:dataTrazabilidad= {
        datos_actuales: antes,
        datos_actualizados: despues,
        idModulo: 17,
        idMovimiento,
        modulo: "Configuración visual",
        movimiento,
        subModulo: "Aplicativo de HealthBook"
    }
    this.tzs.postTrazabilidad(dataTrazabilidad);
  }
  get fv() {
    return this.form.value
  }
  get fc() {
    return this.form.controls
  }

  openModalStatus(btn: string, mensaje: string, type: string) {
    this.modalService.openStatusMessage(btn, mensaje, type)
  }

  cambiarTheme(value: string) {
    this.changeThemeService.cambiarTema(value);
  }
  cambiarFuente(value: string) {
    this.changeThemeService.cambiarFuente(value);
  }

  obtenerBase64(campo: string, value: string) {
    if (value !== '') this.openModalStatus('Continuar', 'Imagen cargada', '1')
    this.form.get(campo)?.setValue(value);
  }

  async getConfiguracion() {

    this.loader.show();
    await lastValueFrom(this.cvs.getConfiguracionVisual())
      .then((x: any) => {
        if (x.ok) {
          const {
            idVisualConfiguration,
            idUserAction,
            titleEntry,
            textEntry,
            fileLoad,
            colorPalette,
            idTypography,
            typography,
            dataProcessing,
            mainLogo,
            logoFooter,
            logoFavicon,
            primaryColor,
            secondaryColor,
            tertiaryColor,
            fourthColor,
          } = x.data;
          this.themeOriginal = colorPalette;
          this.tipografiaOriginal = idTypography;
          const newData: configVisual = {
            idVisualConfiguration,
            idUserAction,
            titleEntry,
            textEntry,
            fileLoad,
            colorPalette,
            idTypography,
            typography,
            dataProcessing,
            mainLogo,
            logoFooter,
            logoFavicon,
            primaryColor,
            secondaryColor,
            tertiaryColor,
            fourthColor
          }
          if (idVisualConfiguration) {
            this.form.setValue(newData);
            this.dataConfigVisual = x.data;
          }
          return;
        }
        this.openModalStatus('Cerrar', x.message, '3')
      }).catch(e => this.openModalStatus('Cerrar', 'Lo sentimos ha ocurrido un error inesperado', '4'));
    this.loader.hide();
  }

  retornarBase64Trazabilidad(valor:string,keyBase64:string){
    return valor.match('VisualConfig')?this.dataConfigVisual[keyBase64]:valor;
  }

  async guardarEditar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return this.openModalStatus('Cerrar', 'Recuerde llenar todos los campos', '3');
    }
    this.loader.show();

    await lastValueFrom(this.cvs.CrearActualizarConfiguracionVisual(this.form.value))
      .then(async (x: any) => {
        if (x.ok) {

          if(this.dataConfigVisual){
            const despues = {
              ...this.form.value,
              fileLoadBase64:this.retornarBase64Trazabilidad(this.form.value.fileLoad,'fileLoadBase64'),
              dataProcessingBase64:this.retornarBase64Trazabilidad(this.form.value.dataProcessing,'dataProcessingBase64'),
              mainLogoBase64:this.retornarBase64Trazabilidad(this.form.value.mainLogo,'mainLogoBase64'),
              logoFaviconBase64:this.retornarBase64Trazabilidad(this.form.value.logoFavicon,'logoFaviconBase64'),
              logoFooterBase64:this.retornarBase64Trazabilidad(this.form.value.logoFooter,'logoFooterBase64'),
              fullNameUserAction: this.nombreUsuario
            }
            this.trazabilidad(this.dataConfigVisual,despues,2,'Edición')
          }else{
            this.trazabilidad(this.form.value,null,1,'Creación')
          }
          await this.getConfiguracion()

          if (this.fv.colorPalette) {
            sessionStorage.setItem('color', this.fv.colorPalette);
          }
          if (this.fv.typography) {
            sessionStorage.setItem('tipografia', this.fv.typography);
          }
          if (this.fv.titleEntry) {
            sessionStorage.setItem('title', this.fv.titleEntry);
          }
          if (this.fv.textEntry) {
            sessionStorage.setItem('text', this.fv.textEntry);
          }

          return this.openModalStatus('Continuar', 'Configuración actualizada en el sistema correctamente, por favor cierre sesión para ver los cambios.', '1');

        }
        return this.openModalStatus('Cerrar', x.message, '4')
      })
      .catch(e => this.openModalStatus('Cerrar', 'Lo sentimos ha ocurrido un error inesperado', '4'))
    this.loader.hide();
  }
}
