import { AfterViewInit, Component, ElementRef, HostListener, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router, RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';

import { MenuComponent } from "../../shared/menu/menu.component";
import { LoaderService } from '../../services/loader/loader.service';
import { AuthService } from '../../services/autenticacion/auth..service';
import { ModalData } from '@app/shared/globales/Modaldata';
import { ModalGeneralComponent } from '@app/shared/modals/modal-general/modal-general.component';
import { ChangeThemeService } from '@app/services/cambio-tema/change-theme.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { HubService } from '@app/services/hubs/hub.service';

@Component({
  selector: 'app-logged',
  standalone: true,
  imports: [RouterModule, MatIconModule, MenuComponent, CommonModule, RouterLink, MatTooltipModule, CdkScrollable],
  templateUrl: './logged.component.html',
  styleUrls: ['./logged.component.scss']
})
export class LoggedComponent implements AfterViewInit {
  private destroy$ = new Subject<void>();

  @ViewChild('patientIconsContainer') patientContainer!: ElementRef;
  @ViewChild('userButton') userButton!: ElementRef;
  @ViewChild('inactividadModal') inactividadModal: TemplateRef<any> | undefined;

  isMenuOpen = false;
  isPatient = false;
  actualUsuario = '';
  time: any;
  headLogoFlag: boolean = false;
  headLogoImage: string = '';
  FooterLogoFlag: boolean = false;
  FooterLogoImage: string = ''

  constructor(
    private renderer: Renderer2,
    private loaderSvc: LoaderService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private changueThemeSVC: ChangeThemeService,
    private hubService: HubService
  ) {
    this.hubService.connectToSocket();
    this.initializeRouterEvents();
  }

  ngOnInit(): void {
    this.decodeToken();
    this.inactividad();
    this.consultarImagenes();
    this.changueThemeSVC.consultarTemaUsuario();
  }

  ngAfterViewInit() {
    this.updateMenuClasses();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.time);
  }

  // Inicializa los eventos del router
  private initializeRouterEvents() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.changueThemeSVC.consultarTemaUsuario();
        this.consultarImagenes();
      }
    });
  }

  // Decodifica el token del usuario para obtener información relevante
  private decodeToken() {
    const tokenDecoded = this.authService.decodeToken();
    if (tokenDecoded) {
      this.actualUsuario = tokenDecoded.IdPatient ? tokenDecoded.IdPatient[0] : null,
        this.isPatient = tokenDecoded && tokenDecoded.IdPatient[1] && tokenDecoded.IdPatient[1] != "0" ? tokenDecoded.IdPatient[1] : 0

    }
  }


  // Maneja la inactividad del usuario
  @HostListener('document:mousemove')
  @HostListener('document:keypress')
  @HostListener('document:click')
  @HostListener('document:wheel')
  inactividad() {
    if (this.router.url.includes('inicio')) {
      clearTimeout(this.time);
      this.time = setTimeout(() => {
        this.openModalInactivo(this.inactividadModal);
        this.authService.logout();
      }, 600000); // 10 minutos de inactividad
    }
  }

  // Alterna el estado del menú
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    this.updateMenuClasses();
  }

  // Actualiza las clases según el estado del menú
  updateMenuClasses() {
    if (this.patientContainer && this.userButton) {
      if (this.isMenuOpen) {
        this.renderer.addClass(this.patientContainer.nativeElement, 'menu-open');
        this.renderer.addClass(this.userButton.nativeElement, 'active');
      } else {
        this.renderer.removeClass(this.patientContainer.nativeElement, 'menu-open');
        this.renderer.removeClass(this.userButton.nativeElement, 'active');
      }
    }
  }

  // Lógica para cerrar el menú desde el componente del menú
  onMenuClosed() {
    this.isMenuOpen = false;
    this.updateMenuClasses();
  }

  // Consulta las imágenes del tema de la aplicación
  consultarImagenes() {
    const images = this.changueThemeSVC.consultarLogos();
    if (images) {
      this.headLogoFlag = !!images.logo;
      this.headLogoImage = images.logo ? this.convertirBase64AUrl(images.logo, 'image/png') : '';
      this.FooterLogoFlag = !!images.logoFooter;
      this.FooterLogoImage = images.logoFooter ? this.convertirBase64AUrl(images.logoFooter, 'image/png') : '';
      if (images.favicon) this.actualizarFavicon(images.favicon);
    } else {
      this.headLogoFlag = false;
      this.headLogoImage = '';
      this.FooterLogoFlag = false;
      this.FooterLogoImage = '';
    }
  }

  // Convierte una cadena en base64 a una URL
  convertirBase64AUrl(base64: string, contentType: string): string {
    return `data:${contentType};base64,${base64}`;
  }

  // Actualiza el favicon de la aplicación
  actualizarFavicon(base64Favicon: string) {
    const faviconUrl = this.convertirBase64AUrl(base64Favicon, 'image/png');
    let faviconElement = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!faviconElement) {
      faviconElement = document.createElement("link");
      faviconElement.rel = "icon";
      document.head.appendChild(faviconElement);
    }
    faviconElement.href = faviconUrl;
  }

  // Cierra la sesión del usuario
  logout() {
    this.authService.logout();

    // Se cierra menu cuando se cierra sesion
    this.isMenuOpen = false;
    this.updateMenuClasses();
  }


  // Abre el modal de inactividad del usuario
  openModalInactivo(template: TemplateRef<any> | undefined, titulo: string = '', mensaje: string = '') {
    this.dialog.closeAll();
    const destroy$: Subject<boolean> = new Subject<boolean>();
    const data: ModalData = {
      content: template,
      btn: 'Aceptar',
      btn2: '',
      footer: true,
      title: titulo,
      type: '3',
      message: '¡Su sesión se ha cerrado por más de 10 minutos de inactividad!',
      image: ''
    };
    const dialogRef = this.dialog.open(ModalGeneralComponent, { height: 'auto', width: '40em', data, disableClose: true });

    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(() => {
      dialogRef.close();
    });
  }
}
