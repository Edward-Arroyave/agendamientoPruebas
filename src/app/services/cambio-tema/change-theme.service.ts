import { AuthService } from './../autenticacion/auth..service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChangeThemeService {

  currentTheme: string = 'light-theme';


  tipoGrafia: any[] = [
    { nomTipoGrafia: 'Arial, Helvetica, sans-serif', idTipografia: 1 },
    { nomTipoGrafia: "Gill Sans, Gill Sans MT, Calibri, Trebuchet MS, sans-serif", idTipografia: 2 },
    { nomTipoGrafia: "Georgia, Times New Roman, Times, serif", idTipografia: 3 },
    { nomTipoGrafia: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif", idTipografia: 4 },
    { nomTipoGrafia: "Trebuchet MS, Lucida Sans Unicode, Lucida Grande, Lucida Sans, Arial, sans-serif", idTipografia: 5 },
    { nomTipoGrafia: "Verdana, Geneva, Tahoma, sans-serif", idTipografia: 6 },
    { nomTipoGrafia: "Mulish , Mulish-Bold, Mulish-ExtraBold", idTipografia: 7 }
  ];

  //Arreglo que contiene los nombres de los colores con los colores 01, 03 y 05 respectivamente
  themeNames = [
    { nomPaleta: 'red', colores: ['#EB1D1D', '#680D0E', '#F06161','#F28D8C'] },
    { nomPaleta: 'redish-blue', colores: ['#0779B1', '#0D3A50', '#BE2040','#A3D3EA','#'] },
    { nomPaleta: 'red-violet', colores: ['#E33B2D', '#551F13', '#633493','#F2AD9D'] },
    { nomPaleta: 'bluesh-red', colores: ['#E32D2E', '#551011', '#02AFF0','#F8ACAC'] },
    { nomPaleta: 'bluesh-green', colores: ['#28BA9E', '#0D4B3F', '#09B3D1','#97DDCF'] },
    { nomPaleta: 'blue', colores: ['#1F7EDD', '#0D4568', '#61AEF0','#8CCBF2'] },
    { nomPaleta: 'bluesh-green-invert', colores: ['#09B3D1', '#0D4B3F', '#28BA9E','#8DD8E5'] },
    { nomPaleta: 'curuba-blue', colores: ['#1F41BA', '#0F1D52', '#EBAD54','#AFD7FA'] },
    { nomPaleta: 'purple', colores: ['#7a1dd7', '#450D68', '#B361F0','#CB8CF2'] },
    { nomPaleta: 'yellowish-purple', colores: ['#9E45C7', '#3E1153', '#E9BC00','#DBADF0'] },
    { nomPaleta: 'blues-purple', colores: ['#AD4DA8', '#52104E', '#3682B9','#D9A7D6'] },
    { nomPaleta: 'dark-blue-purple', colores: ['#3e5a7b', '#193d6c', '#47718f','#9dacbe'] },
    { nomPaleta: 'pink', colores: ['#DD1FB1', '#680D4C', '#F061D5','#F28CCB'] },
    { nomPaleta: 'blues-pink', colores: ['#E54F9B', '#67143E', '#5B75F3','#F5B5D5'] },
    { nomPaleta: 'pink-violet', colores: ['#EA3666', '#5C1123', '#9D5BD5','#F2ABBB'] },
    { nomPaleta: 'orange', colores: ['#EB741D', '#68340D', '#F09261','#F2B38C'] },
    { nomPaleta: 'navy-orange', colores: ['#DE6600', '#532F10', '#007A7A','#F0C198'] },
    { nomPaleta: 'yellowish-orange', colores: ['#DD821B', '#72440E', '#F4C00E','#EFC89C'] },
    { nomPaleta: 'yellow', colores: ['#EBCB1D', '#68530D', '#F0CF61','#F2DE8C'] },
    { nomPaleta: 'greenish-yellow', colores: ['#E2A300', '#5C4816', '#53B27E','#EDD596'] },
    { nomPaleta: 'bluesh-yellow', colores: ['#F8C000', '#695616', '#01A0E1','#EFD47A'] },
    { nomPaleta: 'green', colores: ['#1FDD61', '#17680D', '#61F061','#94F28C'] },
    { nomPaleta: 'orange-green', colores: ['#3EB940', '#125214', '#EFA229','#A5E8A7'] },
    { nomPaleta: 'gray-blue', colores: ['#007B7B', '#004545', '#a3a1a1','#80B2B2'] },
  ];


  constructor(private authsvc: AuthService) {
  }




  consultarTemaUsuario() {
    let token = sessionStorage.getItem('token')
    if (token) {
      let typography = sessionStorage.getItem('tipografia')
      let color = sessionStorage.getItem('color')
      if (color) {
        this.cambiarTema(color);
      } else {
        this.cambiarTema('bluesh-green');
      }
      if (typography) {
        let letra = this.tipoGrafia.find(t => t.idTipografia == Number(typography))
        if (letra) {
          this.cambiarFuente(letra.nomTipoGrafia);
        }
      } else {
        this.cambiarFuente(this.tipoGrafia[6].nomTipoGrafia);
      }
    } else {
      this.cambiarTema('bluesh-green');
      this.cambiarFuente(this.tipoGrafia[6].nomTipoGrafia);
    }
  }


  consultarLogos() {
    let token = sessionStorage.getItem('token')
    if (token) {
      return {
        favicon: sessionStorage.getItem('favicon'),
        logo: sessionStorage.getItem('logo'),
        logoFooter: sessionStorage.getItem('logoFooter')
      }
    } else {
      return null
    }
  }




  cambiarTema(theme: string) {
    document.body.classList.remove(...Array.from(document.body.classList));
    document.body.classList.add(`${theme}-theme`);
  }
  getColorPrimarySecundarytertiary(theme: string): any[] {
    let item = this.themeNames.find(name => name.nomPaleta == theme);
    if (item) {
      return item.colores;
    }
    return []
  }

  cambiarFuente(value: string) {
    setTimeout(() => {
      document.body.style.setProperty('--fuente', value);
    }, 100);
  }




}
