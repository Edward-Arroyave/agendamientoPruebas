import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '../config/config.service';
import { Observable } from 'rxjs';
import { ChangeThemeService } from '../cambio-tema/change-theme.service';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  private theme: string = '';
  private typography: string = '';
  private logo: string = '';
  private footerImage: string = '';

  constructor(private changueThemeSVC: ChangeThemeService, private http: HttpClient, private cs: ConfigService) {
    this.loadVisualConfig();
  }

  // Método para cargar la configuración visual desde el almacenamiento de sesión
  private loadVisualConfig() {
    this.theme = sessionStorage.getItem('color') || 'default-theme';
    this.typography = sessionStorage.getItem('tipografia') || 'Mulish';

    // Obtener las imágenes en base64 desde el servicio
    const images = this.changueThemeSVC.consultarLogos();
    if (images) {
      this.logo = images.logo ? this.convertirBase64AUrl(images.logo, 'image/png') : '';
      this.footerImage = images.logoFooter ? this.convertirBase64AUrl(images.logoFooter, 'image/png') : '';
    } else {
      this.logo = '';
      this.footerImage = '';
    }
  }

  // Método para convertir base64 en una URL
  private convertirBase64AUrl(base64: string, mimeType: string): string {
    return `data:${mimeType};base64,${base64}`;
  }

  // Método público para enviar cualquier tipo de correo
  sendEmail(type: string, data: any): Observable<any> {
    const emailData = this.getEmailData(type, data);
    return this.http.post(`${this.cs.base}api/emailData`, emailData);
  }

  // Método para generar la vista previa de un correo específico
  generatePreview(type: string, data: any): string {
    return this.getTemplate(type, data);
  }

  // Método privado para obtener los datos del correo según el tipo
  private getEmailData(type: string, data: any): any {
    const template = this.getTemplate(type, data);
    const subject = this.getSubject(type);

    return {
      to: data.email,
      subject,
      body: template,
    };
  }

  // Método para obtener el asunto del correo según el tipo
  private getSubject(type: string): string {
    switch (type) {
      case 'cita-reservada':
        return 'Confirmación de cita reservada';
      case 'cita-confirmada':
        return 'Confirmación de cita';
      case 'cancelacion':
        return 'Notificación de cancelación';
      case 'reprogramacion':
        return 'Notificación de reprogramación';
      case 'credenciales':
        return 'Bienvenido - Credenciales de acceso';
      default:
        return 'Notificación';
    }
  }

  // Método para obtener la plantilla general del correo
  // Método para obtener la plantilla general del correo
  private getTemplate(type: string, data: any): string {
    const baseTemplate = `
      <div style="font-family: ${this.typography}; border-radius: 8px; box-shadow: 0px 3px 6px #b1b1b1; width: 700px; background: #ffff;">
         <div style="background: var(--color-01); height: 200px; display: flex; justify-content: center; align-items: center;  position: relative;">
           <img style="width: 100%; width: 99%; position: absolute; top: 20px; z-index:1;" src="assets/images/logos/puntosSuperior.png" alt="">
           <img src="${this.logo}" alt="Logo"  style="max-width: 150px !important; display: block; max-height: 80px; z-index:2;" />
        </div>
        <div>{{bodyContent}}</div>
        <footer  style=" border-top: 1px solid var(--color-05); border-bottom: 1px solid var(--color-05);" box-shadow: 0px 3px 6px #b1b1b1;>

          <img src="${this.footerImage}" alt="Footer"  style="max-width: 150px !important; display: block; margin: 0 auto 20px; max-height: 80px;"  />
        </footer>
        <div  style="height: 40px;background: linear-gradient(180deg, rgba(255, 255, 255, 1) -30%, var(--color-05) 120%); position: relative;display: flex; justify-content: center;">
         <img style="width: 99%; position: absolute; top: -4px; z-index:1;" src="assets/images/logos/puntosInferior.png" alt="">
        </div>

      </div>
    `;

    switch (type) {
      case 'cita-reservada':
        return baseTemplate.replace('{{bodyContent}}', this.generateCitaReservadaContent(data));
      case 'cita-confirmada':
        return baseTemplate.replace('{{bodyContent}}', this.generateConfirmacionCitaContent(data));
      case 'cancelacion':
        return baseTemplate.replace('{{bodyContent}}', this.generateCancelacionContent(data));
      case 'reprogramacion':
        return baseTemplate.replace('{{bodyContent}}', this.generateReprogramacionContent(data));
      case 'credenciales':
        return baseTemplate.replace('{{bodyContent}}', this.generateCredencialesContent(data));
      case 'recordadorio':
        return baseTemplate.replace('{{bodyContent}}', this.generateRecordatorioContent(data));
      default:
        throw new Error('Tipo de correo no soportado');
    }
  }

  // Métodos para generar el contenido específico de cada tipo de correo
  private generateCitaReservadaContent(data: any): string {
    return `
    <div  style=" font-weight:bold; color: var(--color-03); ;display: flex; flex-direction: column; justify-content: center; text-align: center; padding: 20px; background:linear-gradient(180deg,  var(--color-01) 5%, rgba(255,255,255,1) 100%); ">
      <p>¡Hola ${data.nombre}!
     <br>
      <strong>Su cita está reservada para el día:</strong>
      <br>
      <strong>${data.fecha}</strong> a las <strong>${data.hora}</strong>.
      </p>
    </div>

      <div style="font-weight:bold; padding: 50px; border-top: 1px solid var(--color-01); border-bottom: 1px solid var(--color-01); text-align: center; box-shadow: 0px 3px 6px #b1b1b1; display: flex;flex-wrap: wrap;justify-content: center; gap: 10px">

      <span style="color: var(--color-01)"> Categoría:<span/> <span  style="color: #333">${data.categoria} / </span>
      <span style="color: var(--color-01)"> Especialidad:<span/> <span  style="color: #333">${data.especialidad} </span>
      <span style="color: var(--color-01)"> Característica:<span/> <span  style="color: #333">${data.caracteristica} </span>
      <span style="color: var(--color-01)"> Elemento:<span/> <span  style="color: #333">${data.elemento} </span>
      <span style="color: var(--color-01)"> Condición especial:<span/> <span  style="color: #333">${data.condicionEspecial} </span>
      <span style="color: var(--color-01)"> Tipo de atención:<span/> <span  style="color: #333">${data.tipoAtencion} </span>
      <span style="color: var(--color-01)"> Sede:<span/> <span  style="color: #333">${data.sede} </span>   - <a href="${data.mapa}" style="color: var(--color-05);">Ver mapa</a>

      </div>

      <div style="padding: 50px; text-align: center; font-weight:bold; color: #333;">
      <span>Su cita se ha reservado correctamente. En los próximos días recibirá la confirmación de esta y las recomendaciones del examen.</span>

      <br>
      <br>

      <span>Cualquier inquietud por favor enviarla al correo: soporte@laboratoriocolcan.com.</span>
      </div>
    `;
  }


  //Netodo de envio de correo para cuando la cita se confirmo
  private generateConfirmacionCitaContent(data: any): string {
    return `
     <div  style=" font-weight:bold; color: var(--color-03); ;display: flex; flex-direction: column; justify-content: center; text-align: center; padding: 20px; background:linear-gradient(180deg,  var(--color-01) 5%, rgba(255,255,255,1) 100%); ">
      <p>¡Hola ${data.nombre}!
     <br>
      <span>Su cita se encuentra agendada para el día: </span>
      <br>
      <span> ${data.fecha} a las ${data.hora}.</span>


      </p>
    </div>

      <div style="font-weight:bold; padding: 50px; border-top: 1px solid var(--color-01); border-bottom: 1px solid var(--color-01); text-align: center;  display: flex;flex-wrap: wrap;justify-content: center; gap: 10px">

      <span style="color: var(--color-01)"> Categoría:<span/> <span  style="color: #333">${data.categoria} / </span>
      <span style="color: var(--color-01)"> Especialidad:<span/> <span  style="color: #333">${data.especialidad} </span>
      <span style="color: var(--color-01)"> Característica:<span/> <span  style="color: #333">${data.caracteristica} </span>
      <span style="color: var(--color-01)"> Elemento:<span/> <span  style="color: #333">${data.elemento} </span>
      <span style="color: var(--color-01)"> Condición especial:<span/> <span  style="color: #333">${data.condicionEspecial} </span>
      <span style="color: var(--color-01)"> Tipo de atención:<span/> <span  style="color: #333">${data.tipoAtencion} </span>
      <span style="color: var(--color-01)"> Sede:<span/> <span  style="color: #333">${data.sede} </span>   - <a href="${data.mapa}" style="color: var(--color-05);">Ver mapa</a>

      </div>

       <div style="font-weight:bold;display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10px; padding: 50px; border-top: 1px solid var(--color-01); border-bottom: 1px solid var(--color-01); text-align: center; box-shadow: 0px 3px 6px #b1b1b1; display: flex;flex-wrap: wrap;justify-content: center; gap: 10px">

        <span style="color: var(--color-01);">Recomendaciones/Indicaciones exámenes ${data.especialidad}</span>
        <span>${data.recomendacion}</span>
        <span style="color: var(--color-01);">Nota:</span>
        <span>${data.nota}</span>

      </div>

      <div style="padding: 50px;display: flex; flex-direction: column; justify-content: center; align-items: center; font-weight:bold; color: #333;">

       <a style="color: var(--color-05);" href="https://agendamiento-frontend-c-desarrollo-gjgvdsg8b0a3htc3.eastus2-01.azurewebsites.net">De clic aquí para realizar el pago de su examen</a>
       <a style="color: var(--color-05);" href="https://agendamiento-frontend-c-desarrollo-gjgvdsg8b0a3htc3.eastus2-01.azurewebsites.net">De clic aquí para descargar el comprobante de su cita</a>

       <br>
       <br>
         <span style="color:#333;">Cualquier inquietud por favor enviarla al correo:</span>
         <span  style="color:#333;"> soporte@laboratoriocolcan.com</span>
      </div>
    `;
  }

  private generateCancelacionContent(data: any): string {
    return `
     <div  style=" font-weight:bold; color: var(--color-03); ;display: flex; flex-direction: column; justify-content: center; text-align: center; padding: 20px; background:linear-gradient(180deg,  var(--color-01) 5%, rgba(255,255,255,1) 100%); ">
      <p>¡Hola ${data.nombre}!
     <br>
      <span>Su cita para el día: ${data.fecha} </span>
      <br>
      <span> a las ${data.hora} se ha cancelado.</span>


      </p>
    </div>

      <div style="font-weight:bold; padding: 50px; border-top: 1px solid var(--color-01); border-bottom: 1px solid var(--color-01); text-align: center; box-shadow: 0px 3px 6px #b1b1b1; display: flex;flex-wrap: wrap;justify-content: center; gap: 10px">

      <span style="color: var(--color-01)"> Categoría:<span/> <span  style="color: #333">${data.categoria} / </span>
      <span style="color: var(--color-01)"> Especialidad:<span/> <span  style="color: #333">${data.especialidad} </span>
      <span style="color: var(--color-01)"> Característica:<span/> <span  style="color: #333">${data.caracteristica} </span>
      <span style="color: var(--color-01)"> Elemento:<span/> <span  style="color: #333">${data.elemento} </span>
      <span style="color: var(--color-01)"> Condición especial:<span/> <span  style="color: #333">${data.condicionEspecial} </span>
      <span style="color: var(--color-01)"> Tipo de atención:<span/> <span  style="color: #333">${data.tipoAtencion} </span>
      <span style="color: var(--color-01)"> Sede:<span/> <span  style="color: #333">${data.sede} </span>   - <a href="${data.mapa}" style="color: var(--color-05);">Ver mapa</a>

      </div>

      <div style="padding: 50px; text-align: center; font-weight:bold; color: #333;">
      <span>Su cita se para "${data.especialidad}" ha sido cancelada debido a que no cumple con los requisitos establecidos para el examen.</span>

      <br>
      <br>

       <a style="color: var(--color-05);" href="https://agendamiento-frontend-c-desarrollo-gjgvdsg8b0a3htc3.eastus2-01.azurewebsites.net">De click aquí para agendar una nueva cita</a>

       <br>
       <br>
         <span style="color:#333;">Cualquier inquietud por favor enviarla al correo:</span>
         <span  style="color:#333;"> soporte@laboratoriocolcan.com</span>
      </div>
    `;
  }

  private generateReprogramacionContent(data: any): string {
    return `
      <div  style=" font-weight:bold; color: var(--color-03); ;display: flex; flex-direction: column; justify-content: center; text-align: center; padding: 20px; background:linear-gradient(180deg,  var(--color-01) 5%, rgba(255,255,255,1) 100%); ">
      <p>¡Hola ${data.nombre}!
     <br>
      <strong>Su cita ha sido reprogramada para el día:</strong>
      <br>
      <strong>${data.fecha}</strong> a las <strong>${data.hora}</strong>.
      </p>
    </div>

      <div style="font-weight:bold; padding: 50px; border-top: 1px solid var(--color-01); border-bottom: 1px solid var(--color-01); text-align: center; box-shadow: 0px 3px 6px #b1b1b1; display: flex;flex-wrap: wrap;justify-content: center; gap: 10px">

      <span style="color: var(--color-01)"> Categoría:<span/> <span  style="color: #333">${data.categoria} / </span>
      <span style="color: var(--color-01)"> Especialidad:<span/> <span  style="color: #333">${data.especialidad} /</span>
      <span style="color: var(--color-01)"> Característica:<span/> <span  style="color: #333">${data.caracteristica} /</span>
      <span style="color: var(--color-01)"> Elemento:<span/> <span  style="color: #333">${data.elemento} </span>
      <span style="color: var(--color-01)"> Condición especial:<span/> <span  style="color: #333">${data.condicionEspecial} /</span>
      <span style="color: var(--color-01)"> Tipo de atención:<span/> <span  style="color: #333">${data.tipoAtencion} /</span>
      <span style="color: var(--color-01)"> Sala:<span/> <span  style="color: #333">${data.salas} /</span>
      <span style="color: var(--color-01)"> Sede:<span/> <span  style="color: #333">${data.sede} </span>   - <a href="${data.mapa}" style="color: var(--color-05);">Ver mapa</a>

      </div>

      <div style="padding: 50px; text-align: center; font-weight:bold; color: #333;">
      <span>Su cita ha sido reprogramado correctamente. En los proximos días recibirá la confirmación de esta y las recomendaciones del examen.</span>

      <br>
      <br>

      <span>Cualquier inquietud por favor enviarla al correo: soporte@laboratoriocolcan.com.</span>
      </div>
    `;
  }

  private generateCredencialesContent(data: any): string {
    return `
       <div  style="border-bottom: 1px solid var(--color-01); font-weight:bold; color: var(--color-03); ;display: flex; flex-direction: column; justify-content: center; text-align: center; padding: 20px; background:linear-gradient(180deg,  var(--color-01) 5%, rgba(255,255,255,1) 100%); ">
         <span>¡Hola ${data.nombre}!</span>
         <span>Bienvenid@ a HealthBook</span>

         <br>
        <span style="color: #333; text-align: center; padding: 25px;">
        Estas son sus credenciales para el acceso al sistema, recuerde que la contraseña es temporal y al acceder por primera vez se le solicitara cambiar la contraseña.
        </span>

      </div>


      <div  style=" font-weight:bold; color: var(--color-03); ;display: flex; flex-direction: column; justify-content: center; text-align: center; padding: 20px; box-shadow: 0px 3px 6px #b1b1b1;">
          <div>
            <span style="color: var(--color-03);" >Usuario:</span>
            <span style="color: var(--color-01);" >${data.usuario}</span>
          </div>
         <div>
           <span style="color: var(--color-03);" >Contraseña:</span>
           <span style="color: var(--color-01);" >${data.constraseña}</span>
          </div>

      </div>

      <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 25px; font-weight: bold; gap:.5em">

         <a style="color: var(--color-05);" href="https://agendamiento-frontend-c-desarrollo-gjgvdsg8b0a3htc3.eastus2-01.azurewebsites.net">Ingreso a la plataforma</a>
         <br>
         <br>
         <span style="color:#333;">Cualquier inquietud por favor enviarla al correo:</span>
         <span  style="color:#333;"> soporte@laboratoriocolcan.com</span>

      </div>
    `;
  }

  private generateRecordatorioContent(data: any): string {
    return `
      <div  style=" font-weight:bold; color: var(--color-03); ;display: flex; flex-direction: column; justify-content: center; text-align: center; padding: 20px; background:linear-gradient(180deg,  var(--color-01) 5%, rgba(255,255,255,1) 100%); ">
      <p>¡Hola ${data.nombre}!
     <br>
      <strong>Le recordamos su cita para el día:</strong>
      <br>
      <strong>${data.fecha}</strong> a las <strong>${data.hora}</strong>.
      </p>
    </div>

      <div style="font-weight:bold; padding: 50px; border-top: 1px solid var(--color-01); border-bottom: 1px solid var(--color-01); text-align: center; box-shadow: 0px 3px 6px #b1b1b1; display: flex;flex-wrap: wrap;justify-content: center; gap: 10px">

      <span style="color: var(--color-01)"> Categoría:<span/> <span  style="color: #333">${data.categoria} / </span>
      <span style="color: var(--color-01)"> Especialidad:<span/> <span  style="color: #333">${data.especialidad} /</span>
      <span style="color: var(--color-01)"> Característica:<span/> <span  style="color: #333">${data.caracteristica} /</span>
      <span style="color: var(--color-01)"> Elemento:<span/> <span  style="color: #333">${data.elemento} </span>
      <span style="color: var(--color-01)"> Condición especial:<span/> <span  style="color: #333">${data.condicionEspecial} /</span>
      <span style="color: var(--color-01)"> Tipo de atención:<span/> <span  style="color: #333">${data.tipoAtencion} /</span>
      <span style="color: var(--color-01)"> Sala:<span/> <span  style="color: #333">${data.salas} /</span>
      <span style="color: var(--color-01)"> Sede:<span/> <span  style="color: #333">${data.sede} </span>   - <a href="${data.mapa}" style="color: var(--color-05);">Ver mapa</a>

      </div>


       <div style="font-weight:bold; padding: 50px; border-top: 1px solid var(--color-01); border-bottom: 1px solid var(--color-01); text-align: center; box-shadow: 0px 3px 6px #b1b1b1; display: flex;flex-wrap: wrap;justify-content: center; gap: 10px">
        <span style="color: var(--color-01)"> Recomendaciones / Indicaciones Examenes Resonancia contrastada:<span/>
        <br>
        <br>

         <ul style="padding-left: 20px; ">
          <li  style="color: #333">Dieta blanda el día anterior (caldos, sopas, jugos, cremas, purés, té).</li>
          <li  style="color: #333">Restricción de alimentos grasos y derivados de la leche, bebidas negras o gaseosas.</li>
          <li  style="color: #333">El paciente debe asistir 2 horas antes de la cita.</li>
          <li  style="color: #333">Traer 3 BOTELLAS DE AGUA DE 600ML.</li>
          <li  style="color: #333">Traer un pañal para adulto.</li>
          <li  style="color: #333">Ayuno de 6 horas.</li>
      </ul>

      <br>
      <br>
       <span style="color: var(--color-01)"> Nota:<span/>
        <ul style="padding-left: 20px; ">
          <li  style="color: #333">Dieta blanda el día anterior (caldos, sopas, jugos, cremas, purés, té).</li>
          <li  style="color: #333">Restricción de alimentos grasos y derivados de la leche, bebidas negras o gaseosas.</li>

      </ul>
      </div>


      <div style="padding: 50px; text-align: center; font-weight:bold; color: #333;">
     <a href="${data.mapa}" style="color: var(--color-05);">De clic para cancelar su cita</a>
      <br>
      <br>
      <span>Cualquier inquietud por favor enviarla al correo: soporte@laboratoriocolcan.com.</span>
      </div>
      `;
  }
}
