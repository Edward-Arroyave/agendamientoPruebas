import { EventEmitter, Injectable, Output, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { SpinnerText } from '../../shared/loader/loader.component';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {


  isLoading = signal<boolean>(false);
  text = signal<SpinnerText>({ text: "", text1: "", text2: "" });

  show(): void {
    this.isLoading.set(true);
  }

  hide(): void {
    this.text.set({ text: "", text1: "", text2: "" });
    this.isLoading.set(false);
  }
}
