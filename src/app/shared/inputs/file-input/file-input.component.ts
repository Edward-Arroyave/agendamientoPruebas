import { Component, ElementRef, Input, output, ViewChild } from '@angular/core';
import { ModalService } from '../../../services/modal/modal.service';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-file-input',
  standalone: true,
  imports: [MatIcon],
  templateUrl: './file-input.component.html',
  styleUrl: './file-input.component.scss'
})
export class FileInputComponent {

  
  @ViewChild('btnFile') btnFile!: ElementRef<HTMLDivElement>;
  @Input() extensionesPermitidas:string[]= ['png','jpg'];
  @Input() tipo:string ='button';
  @Input() flagData:boolean = false;
  @Input() fileSize:number = 200;

  @Input() mensaje:string = '';

  onEmitBase64= output<string | null>();

  constructor(private modalService:ModalService){}

  openModalStatus(btn:string,mensaje:string,type:string){
    this.modalService.openStatusMessage(btn,mensaje,type)
  }

  onFile(){
    const fileInput = this.btnFile.nativeElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onChageFile(evento:any){
    evento.preventDefault();
    this.handleFile(evento.target.files[0]);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Necesario para permitir el drop
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const button = event.currentTarget as HTMLElement;
    button.classList.remove('dragover');
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  private handleFile(file: File) {
    let base64FileData:string | null;
    let flag:boolean = true;
    let width:number = 0;
    let height:number = 0;


    if( !this.extensionesPermitidas.includes(file.name.split('.')[1]) ){
      this.flagData = false;
      this.openModalStatus('Volver',`¡¡ Extensión no permitida (permitidas ${this.extensionesPermitidas.slice().join(',')}) !!`,'4');
      return
    }
    const img = new Image();
    img.src = URL.createObjectURL(file);
     img.onload = ()=> {
      width = img.width;
      height = img.height;
      if(width > this.fileSize || height > this.fileSize) flag = false;
      if(!flag) {
        this.flagData = false;
        return this.openModalStatus('Cerrar',`La imagen no cumple con las recomendaciones, dimensiones de la imagen actual: ${width} x ${height}, recomendada menor o igual a: ${this.fileSize} x ${this.fileSize} `,'4');
      }
      
      // Convertir archivo a base64
      const reader = new FileReader();
      reader.onload = (e) => {
        base64FileData = (e.target?.result as string) || null;
        this.onEmitBase64.emit(String(base64FileData).split(',')[1]);
        this.flagData = true;
      };
      reader.onerror = (error) => {
        this.flagData = false;
        this.openModalStatus('Volver','¡¡ Error al leer el archivo: !!','4')
      };
      reader.readAsDataURL(file); // Lee el archivo y lo convierte a base64
    }    

  }

}
