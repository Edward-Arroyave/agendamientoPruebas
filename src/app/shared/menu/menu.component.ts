import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Output, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/autenticacion/auth..service';
import { MenuItem, MenuResponse, SubMenuItem } from '../interfaces/menu/menu.model';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})

export class MenuComponent implements OnInit{
  @Output() menuClosed = new EventEmitter<void>();

  menus: MenuItem[] = [];
  openMenuIndex: number | null = null;
  menuIsOpen: boolean = true;

  constructor(private elRef: ElementRef, private authSvc: AuthService) {
  }

  ngOnInit() {
    this.loadMenuData();
  }

  // Cargar datos del menú desde AuthService
  private loadMenuData() {
    const menuData = this.authSvc.getMenuByUser();
    if (menuData) {
      this.menus = menuData;
    } else {
      console.error('No se encontró el menú o hay un problema con los permisos.');
    }
  }

  // Obtener el enlace del menú basado en el nombre del menú
  getMenuLink(menuName: string): string {

    const linksMap: { [key: string]: string } = {

      //Submenu para Agenda General
      'Agendar una cita':           'agenda-general/agendamiento',
      'Administración de reservas': 'agenda-general/admin-reserva',
      'Administración de citas':    'agenda-general/admin-citas',
      'Administración de espacios': 'agenda-general/admin-espacios',
      'Configuración de agenda':    'agenda-general/configuracion-agenda',
      'Actualización de datos':     'agenda-general/actualizar-datos',
      'Historico de citas':         'agenda-general/historico',

      //Submenu para Administracion
      'Usuarios':                   'administracion/usuarios',
      'Roles y permisos':           'administracion/roles-permisos',
      'Sedes':                      'administracion/sedes',
      'Procedencias y entidades':   'administracion/procedencias',
      'Trazabilidad':               'administracion/trazabilidad',
      'Pasarela de pagos':          'administracion/gateway',

      //Submenu para Parametrizacion
      'Categorías':                 'parametrizacion/categorias',
      'Especialidades':             'parametrizacion/especializaciones',
      'Características':            'parametrizacion/caracteristicas',
      'Elementos':                  'parametrizacion/elementos',
      'Preparaciones':              'parametrizacion/preparaciones',
      'Exámenes de laboratorio':    'parametrizacion/examenes',

      //Submenu oara Cambio Visual
      'Aplicativo de HealthBook': 'cambio-visual/confi-visual',
      'Correos electrónicos':       'cambio-visual',

      //Submenu interoperabilidad

      'Integraciones' : 'interoperabilidad/integraciones',
      'Diccionario de datos': 'interoperabilidad/diccionario',
      'Homologación': 'interoperabilidad/homologaciones',
      'Monitor y control': 'interoperabilidad/monitor',
    };

    return linksMap[menuName] || '#';
  }

  // Alternar apertura y cierre del menú principal
  toggleMainMenu() {
    this.menuIsOpen = !this.menuIsOpen;
  }

  // Verificar si el menú está abierto
  isMenuOpen(): boolean {
    return this.menuIsOpen;
  }

   // Alternar apertura y cierre de un submenú específico
   toggleSubMenu(index: number) {
    this.openMenuIndex = this.openMenuIndex === index ? null : index;
  }

  // Verificar si un submenú específico está abierto
  isSubMenuOpen(index: number): boolean {
    return this.openMenuIndex === index;
  }

  // Seleccionar un submenú y cerrar el menú completo
  selectSubMenu() {
    this.menuIsOpen = false;
    this.openMenuIndex = null;
    this.menuClosed.emit(); // Emitir evento para cerrar el menú
  }

  // Verificar si el elemento actual es el último de la lista
  isLastElement(items: any[], currentItem: any): boolean {
    return items[items.length - 1] === currentItem;
  }

  // Verificar si el elemento actual es el primero de la lista
  isFirstMenuElement(menus: MenuItem[], currentMenu: MenuItem): boolean {
    return menus[0] === currentMenu;
  }

  // Manejar clic fuera del menú para cerrarlo
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    const clickedInside = this.elRef.nativeElement.contains(event.target);
    if (!clickedInside && this.openMenuIndex !== null) {
      this.menuIsOpen = false;
      this.openMenuIndex = null;
      this.menuClosed.emit(); // Emitir evento para cerrar el menú al hacer clic afuera
    }
  }
}
