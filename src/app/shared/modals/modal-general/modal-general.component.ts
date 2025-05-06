import { CommonModule, NgStyle } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Inject, Output, output, TemplateRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';

export enum ModalColors {
  TOMATO = 'rgba(209, 62, 73, 1)',
  BLUE = '#006EA1',
  YELLOW = '#FFB703',
  GREEN = '#129C8D',
  WHITE = '#FFFFFF',
  PURPLE = '#6379D8',
  CBLUE = 'rgba(0, 160, 236, 1)'
}

@Component({
  selector: 'app-modal-general',
  standalone: true,
  imports: [CommonModule, MatDialogModule,MatIcon],
  templateUrl: './modal-general.component.html',
  styleUrl: './modal-general.component.css'
})
export class ModalGeneralComponent {



  content!: TemplateRef<any> | null;
  btn?: string;
  btn2?: string;
  permiso?: boolean;
  error?: boolean;
  footer?: boolean;
  type?: string;
  color?: ModalColors.CBLUE;
  title?: string;
  image?: string;
  message:string;
  message2:string;
  lineColor!:string;
  linearGradient!:string;
  linearGradientButton!:string;

  @Output() primaryEvent: EventEmitter<void>;
  @Output() secondaryEvent: EventEmitter<void>;

  ngAfterViewChecked(): void {
    this.changeDetectorRef.detectChanges();
  }

  constructor(
    public dialogRef: MatDialogRef<ModalGeneralComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly changeDetectorRef: ChangeDetectorRef) {
    this.content = this.data?.content;
    this.btn = this.data?.btn;
    this.title = this.data?.title;
    this.image = this.data?.image
    this.btn2 = this.data?.btn2;
    this.error = this.data?.error;
    this.type = this.data?.type;
    this.message = this.data?.message;
    this.message2 = this.data?.message2;
    this.footer = this.data?.footer !== undefined ? this.data?.footer : true;
    this.color = this.data?.color !== undefined ? this.data?.color : ModalColors.CBLUE;
    this.primaryEvent = new EventEmitter<void>();
    this.secondaryEvent = new EventEmitter<void>();

  }

  ngOnInit(): void {
    if(this.type === '1') {
      this.lineColor = 'var(--exito)';
      this.linearGradient = 'transparent linear-gradient(180deg, var(--exito) 0%, #FFFFFF 70%) 0% 0% no-repeat padding-box';
      this.linearGradientButton = 'transparent linear-gradient(180deg, var(--exito) 0%, var(--exito-light) 70%) 0% 0% no-repeat padding-box';
    };
    if(this.type === '2') {
      this.lineColor = 'var(--ayuda)';
      this.linearGradient = 'transparent linear-gradient(180deg, var(--ayuda) 0%, #FFFFFF 70%) 0% 0% no-repeat padding-box';
      this.linearGradientButton = 'transparent linear-gradient(180deg, var(--ayuda) 0%, var(--ayuda-light) 70%) 0% 0% no-repeat padding-box';
    };
    if(this.type === '3') {
      this.lineColor = 'var(--advertencia)';
      this.linearGradient = 'transparent linear-gradient(180deg, var(--advertencia) 0%, #FFFFFF 70%) 0% 0% no-repeat padding-box';
      this.linearGradientButton = 'transparent linear-gradient(180deg, var(--advertencia) 0%, var(--advertencia-light) 70%) 0% 0% no-repeat padding-box';
    };
    if(this.type === '4') {
      this.lineColor = 'var(--error)';
      this.linearGradient = 'transparent linear-gradient(180deg, var(--error) 0%, #FFFFFF 70%) 0% 0% no-repeat padding-box';
      this.linearGradientButton = 'transparent linear-gradient(180deg, var(--error) 0%, var(--error-light) 70%) 0% 0% no-repeat padding-box';
    };
  }

  public close() {
    this.dialogRef.close();
  }

  second() {
    this.secondaryEvent?.emit();
  }
  primary() {
    this.primaryEvent?.emit();
  }

}
