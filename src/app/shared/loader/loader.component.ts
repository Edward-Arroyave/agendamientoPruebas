import { ChangeDetectorRef, Component, effect } from '@angular/core';
import { LoaderService } from '../../services/loader/loader.service';
import { AsyncPipe } from '@angular/common';

export class SpinnerText {
  text: string = '';
  text1?: string;
  text2?: string;
  class?: string;
}

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss'
})
export class LoaderComponent {

  percent: number = 0;
  stateLoad = this.loaderSvc.isLoading();
  dataText = this.loaderSvc.text();
  isCalculating = false; // Bandera para evitar llamadas paralelas
  isRunning = false;

  constructor(private loaderSvc: LoaderService) {

    effect(() => {
      if (this.loaderSvc.isLoading()) {
        this.stateLoad = true;
        this.percent = 0;
        this.dataText = this.loaderSvc.text()
        this.isRunning = true;
        this.calcPorcentaje();
      } else {

        this.endPercent()
      }
    });
  }



  calcPorcentaje() {
    if (!this.isRunning) {
      return;
    }
    if (this.isCalculating) {
      return; // Si ya está calculando, no iniciar otro ciclo
    }

    this.isCalculating = true;

    if (this.percent < 50) {
      this.percent++;
      setTimeout(() => {
        this.isCalculating = false;
        this.calcPorcentaje();
      }, 100);
    } else if (this.percent < 90) {
      this.percent++;
      setTimeout(() => {
        this.isCalculating = false;
        this.calcPorcentaje();
      }, 550);
    } else if (this.percent < 99) {
      this.percent++;
      setTimeout(() => {
        this.isCalculating = false;
        this.calcPorcentaje();
      }, 10000);
    } else if (this.percent == 99) {
      this.percent = 99;
      this.loaderSvc.text.set({ text: 'Espere por favor' });
      this.isCalculating = false; // Liberar la bandera
    }
  }


  endPercent() {
    this.isRunning = false;
    if (this.percent < 100) {
      this.percent++;
      setTimeout(() => this.endPercent(), 5);
    } else {
      this.stateLoad = false;
      this.dataText.text = '';
      this.percent = 0;
      return
    }

  }

}
