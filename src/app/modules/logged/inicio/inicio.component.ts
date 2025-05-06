import { AuthService } from '@app/services/autenticacion/auth..service';
import { NgClass, NgStyle } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, TemplateRef, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ChangeThemeService } from '../../../services/cambio-tema/change-theme.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [NgStyle, MatIconModule, NgClass, RouterLink],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.scss'
})
export class InicioComponent {

  cuadros: any = [];
  cuadrosInversa: any = [];
  text: string = ''
  title: string = ''
  imagen = ''
  menuAvailable: any = [];

  constructor(private changueThemeSVC: ChangeThemeService, private authSvc: AuthService) { }


  ngOnInit(): void {
    this.construirCuadros()
    this.verificarTextoUsuario()
    this.verifyMenuAvailable()
  }



  @HostListener('window:resize', ['$event'])
  Resolucion(event: any): void {
    setTimeout(() => {
      this.construirCuadros()
    }, 100)
  }

  construirCuadros() {

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;


    let numeroInicial = 0;
    let cantidad = 0;
    let bordeDivisor = 8
    if (screenWidth > 1500) {
      numeroInicial = 12;
      cantidad = 16;
      bordeDivisor = 8
    }
    else if (screenWidth > 1200) {
      numeroInicial = 12;
      cantidad = 12;
      bordeDivisor = 8
    } else if (screenWidth > 800) {
      numeroInicial = 8;
      cantidad = 8;
      bordeDivisor = 7;
    } else {
      numeroInicial = 5;
      cantidad = 7;
      //  bordeDivisor = 2;
    }

    let numeroY =  screenHeight > 650 ? 6 : 4 ;
    let numerox = numeroInicial;
    let cuadros = [];
    let i = 0;
    let reduccion = numeroInicial / cantidad;

    while (i < numeroY) {
      cuadros.push({
        ancho: numerox,
        alto: numerox,
        borde: Math.floor(Math.random() * bordeDivisor) + 1
      });
      numerox -= reduccion;
      if (numerox <= 0) {
        i++;
        numerox = numeroInicial;
      }
    }

    this.cuadros = cuadros;
    this.cuadrosInversa = cuadros.slice().reverse();
  }


  verificarTextoUsuario() {
    let text = sessionStorage.getItem('text');
    let title = sessionStorage.getItem('title');
    let imagen = sessionStorage.getItem('mainImagen');

    if (title) {
      this.title = title;
    } else {
      this.title = 'HealthBook'
    }
    if (text) {
      this.text = text;
    } else {
      this.text = '¡Le da la bienvenida!'
    }
    if (imagen) {
      this.imagen = this.convertirBase64AUrl(imagen, 'image/png');;
    } else {
      this.imagen = '/assets/images/logos/calendario.png'
    }
  }

  convertirBase64AUrl(base64: string, contentType: string): string {
    return `data:${contentType};base64,${base64}`;
  }

  verifyMenuAvailable() {

    const menuData = this.authSvc.getMenuByUser();
    if (!menuData) {
      this.menuAvailable = [];
      return
    } else {
      let tokenDecoded = this.authSvc.decodeToken()
      let isPatient = false;
      if (tokenDecoded && tokenDecoded.IdPatient[1] && tokenDecoded.IdPatient[1] != "0") {
        isPatient = true
        this.menuAvailable = [{
          name: 'Agendar una cita',
          link: 'agenda-general/agendamiento',
          icon: 'home_agendar',
          i: 0
        },
        {
          name: 'Gestionar reservas',
          link: 'agenda-general/admin-reserva',
          icon: 'home_reservas',
          i: 1
        },
        {
          name: 'Actualización de datos',
          link: 'agenda-general/actualizar-datos',
          icon: 'home_actualizar',
          i: 2
        },
        ]
      } else {
        isPatient = false
        this.menuAvailable = [];
        let i = 0 ;
        let agenda = menuData.find((x: any) => x.Name == 'Agenda general')

        if (agenda) {
          for (const m of agenda.Children) {
            if (m.Name == 'Agendar una cita' && m.Ver) {
              this.menuAvailable.push({
                name: 'Agendar una cita',
                link: 'agenda-general/agendamiento',
                icon: 'home_agendar',
                i: this.menuAvailable.length
              },)
            }


            if (m.Name == 'Administración de citas' && m.Ver) {
              this.menuAvailable.push({
                name: 'Gestión de citas',
                link: 'agenda-general/admin-citas',
                icon: 'home_citas',
                i: this.menuAvailable.length
              },)
            }
            if (m.Name == 'Administración de reservas' && m.Ver) {
              this.menuAvailable.push({
                name: 'Gestionar reservas',
                link: 'agenda-general/admin-reserva',
                icon: 'home_reservas',
                i: this.menuAvailable.length
              })
            }

            if (m.Name == 'Actualización de datos' && m.Ver) {
              this.menuAvailable.push({
                name: 'Actualización de datos',
                link: 'agenda-general/actualizar-datos',
                icon: 'home_actualizar',
                i: this.menuAvailable.length
              },)
            }
            i++
          }

        }


      }
    }


  }





}
