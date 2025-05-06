import { Overlay, OverlayModule } from '@angular/cdk/overlay';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnChanges, OnInit, output, signal, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
@Component({
  selector: 'app-select-input',
  standalone: true,
  imports: [
    OverlayModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatIcon,
    ScrollingModule
  ],
  templateUrl: './select-input.component.html',
  styleUrl: './select-input.component.scss'
})
export class SelectInputComponent implements AfterViewInit, OnChanges, OnInit {
  @ViewChild('myDiv') myDiv!: ElementRef<HTMLDivElement>;
  @ViewChild('myDiv2') myDiv2!: ElementRef<HTMLDivElement>;
  @ViewChild('viewport') viewport!: ElementRef;

  @Input() data: any[] = [];
  dataCopy: any[] = [];

  @Input() valueId: string = '';
  @Input() valueDescription: string = '';

  @Input() form!: FormGroup;
  @Input() nameControlform!: string;

  @Input() flagCheck: boolean = false;
  @Input() placeholderText: string = '';
  @Input() searchFlag: boolean = false;
  @Input() isOpen: boolean = false;

  openSingal = signal<boolean>(false);
  onIsOpen = output<boolean>();

  viewportHeight = 30;

  protected strategiablock = this.overlay.scrollStrategies.reposition();

  totalChecked: any[] = [];
  allChecked: boolean = false;

  selected: string = '';
  selectedName: string = '';
  calculateWidth = signal<number>(0);

  constructor(private cdr: ChangeDetectorRef, private overlay: Overlay) {


  }
  ngOnInit(): void {
  }

  ngOnChanges(changes: any): void {
    if (changes.data) this.dataCopy = changes.data.currentValue;
    this.updateViewportHeight();
    const x = this.form.get(this.nameControlform)?.getRawValue();
    if (x === null) {
      this.totalChecked = [];
      return;
    }
    if (this.form && this.data.length !== 0 && x !== null) {
      if (!this.flagCheck) {
        if (this.form.get(this.nameControlform)?.value) {
          this.selected = this.data.filter(y => String(y[this.valueId]) === String(x))[0][this.valueDescription];
          this.selectedName = this.selected;
        }
      } else {
        if (this.form.get(this.nameControlform)?.getRawValue()) {
          const arr: string[] = x;
          this.selected = x;
          this.selectedName = this.data.filter(y => arr.includes(y[this.valueId])).map(x => x[this.valueDescription]).slice(0).join(' , ');
          if (this.selected.length === 0) {
            this.selected = '';
            this.selectedName = '';
          }
          if (arr.length > 0 && arr[0] !== '') {
            const newChecked =arr.map(j => {
              if(this.data.find(y => y[this.valueId] === j)[this.valueId]){
                return this.data.find(y => y[this.valueId] === j)[this.valueId];
              }
              return null;
            });
            this.totalChecked = newChecked;
          }
        }
      }
    }
  }

  ngAfterViewInit(): void {
    this.getDivWidth();
    this.form.get(this.nameControlform)?.valueChanges.subscribe(x => {
      if (x) {

        if (typeof x === 'object') {
          const arr: string[] = x;
          if (arr.length) {
            this.selected = x;
            this.selectedName = this.data.filter(y => arr.includes(y[this.valueId])).map(x => x[this.valueDescription]).slice(0).join(' , ');
          } else {
            this.selected = '';
            this.selectedName = '';
          }
          return
        }
        if (this.form.get(this.nameControlform)?.getRawValue() && this.data.length) {
          this.selected = this.data.filter(y => String(y[this.valueId]) === String(x))[0][this.valueDescription];
          this.selectedName = this.selected;
        } else {
          this.selected = '';
          this.selectedName = '';
        }
      } else {
        this.selected = '';
        this.selectedName = '';
      }

    });
  }

  private updateViewportHeight() {
    const itemCount = this.data.length;
    let itemSize = 34; // Tamaño de cada ítem (debe coincidir con itemSize del HTML)
    if (this.flagCheck) itemSize = 50;
    this.viewportHeight = Math.min(itemCount * itemSize, 165) ; // Máximo de 165px
    if(this.flagCheck ) this.viewportHeight ;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.getDivWidth();
  }

  getDivWidth(): void {
    if (this.myDiv && this.myDiv.nativeElement) this.calculateWidth.set(this.myDiv.nativeElement.offsetWidth < 140 ? 140 : this.myDiv.nativeElement.offsetWidth);
  }

  toggleDropdown(): void {
    this.cdr.detectChanges();
    this.data = this.dataCopy;
    this.updateViewportHeight();
    if (this.form.get(this.nameControlform)?.disabled) {
      this.openSingal.set(false);
      this.onIsOpen.emit(this.isOpen);
      return
    } else {
      this.openSingal.set(!this.openSingal());
      this.onIsOpen.emit(this.openSingal());
    }

  }

  @HostListener('document:click', ['$event'])
  onCloseOverlay(event: MouseEvent): void {
    // contieneItems
    if (this.myDiv2) {
      if (this.openSingal() && !this.myDiv2.nativeElement.contains(event.target as Node)) {
        this.openSingal.set(false);
        this.data = this.dataCopy;
        this.onIsOpen.emit(this.openSingal());
      }
    }

  }

  limipiar() {
    this.form.get(this.nameControlform)?.setValue(null);
    this.data = this.dataCopy;
    this.updateViewportHeight();
  }

  checkAll(flag: boolean) {
    this.allChecked = flag;
    if (flag) {
      this.data = this.data.map(x => {x.disabled? x.checked = x.checked : x.checked = true; return x });
      //this.totalChecked = this.data.map(x => x[this.valueId]);
      this.totalChecked = this.data
      .filter(x => x.checked === true)
      .map(x => x[this.valueId]);
      this.selected = '-1';
      this.selectedName = this.totalChecked.length == this.data.length ? 'Todo selecionado' : (this.data.filter(x => x.checked).map(z => z[this.valueDescription])).slice().join(', ');
      this.form.get(this.nameControlform)?.setValue(this.totalChecked);

    } else {
      this.data = this.data.map(x => { x.disabled? x.checked = x.checked : x.checked = false; return x });
      this.totalChecked = this.totalChecked = this.data
      .filter(x => x.checked === true)
      .map(x => x[this.valueId]);
      this.selectedName = (this.data.filter(x => x.checked).map(z => z[this.valueDescription])).slice().join(', ');
      this.form.get(this.nameControlform)?.setValue(this.totalChecked);
    }
  }

  selectItem(itemId: string, itemDescription: string, checked: boolean = false): void {
    this.selected = itemId;
    this.selectedName = itemDescription;
    this.data.filter(x => x[this.valueId] === itemId)[0].checked = checked;
    if (!this.flagCheck) {
      this.openSingal.set(false);
      this.form.get(this.nameControlform)?.setValue(itemId);
    } else {
      if (this.totalChecked.filter(x => x === itemId).length != 0 && !checked) {
        this.totalChecked = this.totalChecked.filter(x => x !== itemId);
      } else {
        checked ? this.totalChecked.push(itemId) : this.totalChecked = this.totalChecked.filter(x => x !== itemId);
      }
      this.form.get(this.nameControlform)?.setValue(this.totalChecked);
      this.selectedName = (this.data.filter(x => x.checked).map(z => z[this.valueDescription])).slice().join(', ')
    };
    if(this.data.find( x => x.checked === false)) this.allChecked = false;
  }

  filterItems(word: any) {
    if (word) {
      this.data = this.dataCopy.filter((item: any) => {
        return item[this.valueDescription].toLowerCase().includes(word.toLowerCase());
      });
    } else {
      this.data = this.dataCopy;
    }
    this.updateViewportHeight();
  }

}
