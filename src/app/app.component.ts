import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IconosService } from './services/registro-iconos/iconos.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { LoaderComponent } from "./shared/loader/loader.component";
import { AuthService } from './services/autenticacion/auth..service';
import { ChangeThemeService } from './services/cambio-tema/change-theme.service';
import { LoaderService } from './services/loader/loader.service';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HttpClientModule, MatIconModule, LoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',

})
export class AppComponent {
  title = 'HealthBook';
  iconsLoaded = false;
  constructor(private iconosService: IconosService, private hhtpclient: HttpClient, private changueThemeSvc: ChangeThemeService, private loadersvc: LoaderService) {
    // Esto asegurará que el servicio se inicialice y los íconos se registren
    this.loadersvc.show()
    this.loadersvc.text.set({ text: 'Cargando contenido' })
    this.iconosService.loadIcons().then(() => {
      this.iconsLoaded = true; // Cambia el estado para que se renderice el contenido
      this.loadersvc.hide()
    }).catch((error) => {
      this.loadersvc.hide()
      console.error('Error al cargar los iconos', error);
      this.iconsLoaded = true; // Aun si hay error, se muestra el contenido
    });
  }

  ngAfterContentInit(): void {
  }

  ngOnInit() {

  }
}
