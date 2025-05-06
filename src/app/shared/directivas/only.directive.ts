import { DecimalPipe } from '@angular/common';
import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appOnly]',
  standalone: true
})
export class OnlyDirective {


  @Input('appOnly') type: string = ''
  @Input('appOnlyOption') option: 'Lower' | 'Upper' | undefined;
  @Input('idIdentificationTypeValue') idIdentificationTypeValue: number | undefined;;

  blank = new RegExp(/^[\ ]+|[\ ]{2,}?|[\ ]+$/g);
  lastword = new RegExp(/([a-zA-z]+$)/g);
  decimalPipe: DecimalPipe;

  constructor(private el: ElementRef, private render: Renderer2, private control: NgControl) {
    this.decimalPipe = new DecimalPipe('en-US');
  }

  @HostListener('input') oninput() {
    const abstractControl = this.control.control;
    let value = this.el.nativeElement.value;
    let r;
    let result;
    const idType = this.idIdentificationTypeValue;
    if (this.type === 'Letters') { // no permite caracteres
      r = new RegExp(/[0-9_-]+/g);
      result = value.replace(r, '');
      r = new RegExp(/[\\#+\[\]@$~%'":*¿?<°(),.&/|¨´;>{}!¡=]/g);
      result = result.replace(r, '');
      this.render.setProperty(this.el.nativeElement, 'value', result);
      abstractControl?.setValue(result);
    }
    if (this.type === 'LettersOnly') { // permite caracteres -(&)/
      r = new RegExp(/[0-9_]+/g);
      result = value.replace(r, '');
      r = new RegExp(/[\\#+\[\]@$~%'":*¿?<°|¨´;>{}!¡=]/g);
      result = result.replace(r, '');
      this.render.setProperty(this.el.nativeElement, 'value', result);
    }
    if (this.type === 'Numbers') { // Permite solo valores númericos
      r = new RegExp(/\D/g);
      result = value.replace(r, '');
      this.render.setProperty(this.el.nativeElement, 'value', result);
      this.control.valueAccessor?.writeValue(result);
      abstractControl?.setValue(result);
    }
    if (this.type === 'NumbersPoints') { // Permite solo valores númericos
      const regex = /[^0-9:]/g;
      result = value.replace(regex, ''); // Reemplaza todos los caracteres no deseados con una cadena vacía
      this.render.setProperty(this.el.nativeElement, 'value', result); // Actualiza el valor del input
      this.control.valueAccessor?.writeValue(result); // Actualiza el control del formulario
      abstractControl?.setValue(result); // Establece el valor en el AbstractControl
    }
    if (this.type === 'NumbersLetters') {// No permite caracteres
      r = new RegExp(/[\\#+\[\]@$~|¬^°¨%'"_;&:*¿?<>(/´)\-,.{}!¡=]/g);
      result = value.replace(r, '');
      this.render.setProperty(this.el.nativeElement, 'value', result);
      abstractControl?.setValue(result);
    }
    if (this.type === 'NumbersLettersOnly') {// permite caracteres ()-/&.,
      r = new RegExp(/[\\#+\[\]@$~|¬^°¨%'"_;:*¿?<>{}!¡=]/g);
      result = value.replace(r, '');
      this.render.setProperty(this.el.nativeElement, 'value', result);
      abstractControl?.setValue(result);
    }
    if (this.type === 'NumbersLettersPG') {// permite caracteres ()-/&.,
      r = new RegExp(/[\\#+\[\]@$~|¬^°¨'"_;:*¿?<>{}!¡=]/g);
      result = value.replace(r, '');
      this.render.setProperty(this.el.nativeElement, 'value', result);
      abstractControl?.setValue(result);
    }
    if (this.type === 'NumbersLettersLine') {// permite guion -
      r = new RegExp(/[\\#+\[\]@$~|¬^°¨%'"_;&:*¿?<>(),.{´}!¡=]/g);
      result = value.replace(r, '');
      this.render.setProperty(this.el.nativeElement, 'value', result);
      abstractControl?.setValue(result);
    }
    if (this.type === 'NumbersLettersDot') {// permite .
      r = new RegExp(/[\\#+\[\]@$~|¬^°¨%'"_;&:*¿?<>(/´)\-,{}!¡=]/g);
      result = value.replace(r, '');
      this.render.setProperty(this.el.nativeElement, 'value', result);
      abstractControl?.setValue(result);
    }
    if (this.type === 'NumbersLine') {
      r = new RegExp(/[^0-9-]/g);
      result = value.replace(r, '');
      this.render.setProperty(this.el.nativeElement, 'value', result);
      abstractControl?.setValue(result);
    }

    if (this.type === 'User') {// No permite espacios y solo permite . - _ * /
      r = new RegExp(/[\\#+\[\]@$~|¬^°¨%'"&¿?<>´{}!¡,()=:;]/g);
      result = value.trim().replace(r, '');
      this.render.setProperty(this.el.nativeElement, 'value', result);
      abstractControl?.setValue(result);
    }
    if (this.type == 'Spaces') {// No permite espacios y solo permite . - _
      r = new RegExp(/[\\#+\[\]$~|¬^°¨%'"&¿?<>´{}!¡*/,()=:;]/g);
      result = value.trim().replace(r, '');
      this.render.setProperty(this.el.nativeElement, 'value', result);
      abstractControl?.setValue(result);
    }
    if (this.type === 'Address') {
      r = new RegExp(/[\\+\[\]&,|()$~%¨'";:*°´_¿?<>{}!¡=]/g);
      result = value.replace(r, '');
      this.render.setProperty(this.el.nativeElement, 'value', result);
      abstractControl?.setValue(result);
    }

    if (this.option === 'Lower') {
      value = result.toLowerCase();
      this.render.setProperty(this.el.nativeElement, 'value', value);
      this.setValueControl(abstractControl, value);
    }
    if (this.option === 'Upper') {
      if (result) {
        value = result.toUpperCase();
        this.render.setProperty(this.el.nativeElement, 'value', value);
        this.setValueControl(abstractControl, value);
      }
    }
    if (this.type === 'FormatNumber') {
      value += '';
      let x = value.split('.');
      let x1 = x[0];
      let x2 = x.length > 1 ? '.' + x[1] : '';
      let rgx = /(\d+)(\d{3})/;
      while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + '.' + '$2');
      }
      r = x1 + x2;
    }

    if (idType === 17) {
      r = new RegExp(/\D/g);
      result = value.replace(r, '');
      this.render.setProperty(this.el.nativeElement, 'value', result);
      this.control.valueAccessor?.writeValue(result);
      abstractControl?.setValue(result);
    } else if (idType === 18) {
      r = new RegExp(/[\\#+\[\]@$~|¬^°¨%'"_;&:*¿?<>(/´)\-,.{}!¡=]/g);
      result = value.replace(r, '');
      this.render.setProperty(this.el.nativeElement, 'value', result);
      abstractControl?.setValue(result);
    }
  }

  @HostListener('change') onchange() {
    let value = this.el.nativeElement.value;
    value = value.trim();
    if (value === '') {
      value = null;
      const abstractControl = this.control.control;
      abstractControl?.setValue(value);
      abstractControl?.updateValueAndValidity();
    }
    this.render.setProperty(this.el.nativeElement, 'value', value);
  }

  setValueControl(abstractControl: any, value: any) {
    if (abstractControl) {
      abstractControl.setValue(value);
    }
  }


}
