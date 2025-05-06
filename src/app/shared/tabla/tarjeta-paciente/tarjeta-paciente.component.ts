import { JsonPipe, CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, input, SimpleChanges } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-tarjeta-paciente',
  standalone: true,
  imports: [CommonModule,MatTooltipModule],
  templateUrl: './tarjeta-paciente.component.html',
  styleUrl: './tarjeta-paciente.component.scss'
})
export class TarjetaPacienteComponent {


  cabeceros = input<string[]>([]);
  itemsBody = input<string[]>([]);
  tarjetaArreglo: any[] = [];

  constructor(private cd: ChangeDetectorRef) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['itemsBody'] && !changes['itemsBody'].isFirstChange()) {
      this.armarTarjeta();
      this.cd.detectChanges();
    }
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.armarTarjeta();
  }
  armarTarjeta() {
    // Limpiar el array antes de llenarlo para evitar duplicados
    this.tarjetaArreglo = [];
  
    const cabecerosArray = this.cabeceros();
    const items = this.itemsBody();
  
    for (let i = 0; i < cabecerosArray.length; i++) {
      let obj = {
        title: cabecerosArray[i],
        subtitle: items[i]
      };
      this.tarjetaArreglo.push(obj);
    }
  }
  





}
