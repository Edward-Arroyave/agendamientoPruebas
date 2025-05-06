import { AfterViewInit, ChangeDetectorRef, Directive, ElementRef, HostListener, Input } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';

@Directive({
  selector: '[appTooltipIfTruncated]',
  standalone: true
})
export class TooltipIfTruncatedDirective implements AfterViewInit {
  // DIRECTIVA PARA APLICAR VISUALIZACIÓN DE TOOLTIP SOLO EN TEXTO TRUNCADO
  // Se aplica a elementos de texto que pueden ser truncados por CSS
  // y muestra un tooltip con el contenido completo si el texto esta truncado


  @Input('appTooltipIfTruncated') tooltipContent: string = '';
  private isTextTruncated = false;

  constructor(
    private el: ElementRef, 
    private tooltip: MatTooltip,
    private cdr: ChangeDetectorRef
  ) { }

  ngAfterViewInit(): void {
    this.checkIfTextIsTruncated();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.checkIfTextIsTruncated();
  }

  private checkIfTextIsTruncated(): void {
    const element = this.el.nativeElement;

    // Detectar si el texto esta trucado
    this.isTextTruncated = element.scrollWidth > element.clientWidth;

    // Habilitar o deshabilitar el tooltip con base al truncamiento
    this.tooltip.disabled = !this.isTextTruncated;

    // Mostrar el tooltip si el texto esta truncado
    if (this.isTextTruncated) {
      this.tooltip.message = this.tooltipContent;
    }

    // Forzar la actualización de la vista
    this.cdr.detectChanges();
  }
}
