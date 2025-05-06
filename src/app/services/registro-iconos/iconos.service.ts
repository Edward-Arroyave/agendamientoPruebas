import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IconosService {
  private registeredIcons: Set<string> = new Set(); // Conjunto para almacenar los iconos registrados

  constructor(
    private matIconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer,
    private http: HttpClient
  ) {

  }

  //Metodo antiguo por si el otro no funciona
  registerIcons(): void {
    this.matIconRegistry.addSvgIcon('paciente', this.sanitizer.bypassSecurityTrustResourceUrl('assets/images/iconos/paciente.svg')
    );
    this.matIconRegistry.addSvgIcon('administrativo', this.sanitizer.bypassSecurityTrustResourceUrl('assets/images/iconos/administrativo.svg')
    );
  }

  public loadIcons(): Promise<void> {
    return new Promise((resolve, reject) => {
      const iconLoadPromises: Promise<any>[] = [];

      this.getIconList().subscribe((data: any) => {
        data.iconos.forEach((icon: string) => {
          const iconUrl = `assets/images/iconos/${icon}.svg`;

          const iconLoadPromise = new Promise<void>((resolveIcon, rejectIcon) => {
            this.http.get(iconUrl, { responseType: 'text' }).subscribe({
              next: () => {
                this.matIconRegistry.addSvgIcon(
                  icon,
                  this.sanitizer.bypassSecurityTrustResourceUrl(iconUrl)
                );
                this.registeredIcons.add(icon);
                resolveIcon();
              },
              error: () => {
                console.error(`No se pudo encontrar el icono: ${iconUrl}`);
                rejectIcon(`Error loading icon: ${iconUrl}`);
              }
            });
          });

          // Guardamos las promesas de todos los iconos
          iconLoadPromises.push(iconLoadPromise);
        });

        // Esperamos a que todos los iconos se registren
        Promise.all(iconLoadPromises)
          .then(() => resolve()) // Si todos los iconos se cargan correctamente
          .catch((error) => reject(error)); // Si algún icono falla
      });
    });
  }



  // Método para obtener el archivo JSON
  public getIconList(): Observable<any> {
    return this.http.get('assets/images/iconos/iconos.json');
  }

  // Método para validar si un icono está registrado
  public isIconRegistered(iconName: string): boolean {
    return this.registeredIcons.has(iconName); // Retorna true o false
  }
}
