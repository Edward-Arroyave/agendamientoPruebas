import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-toggle',
  templateUrl: './toggle.component.html',
  styleUrls: ['./toggle.component.css'],
  standalone: true,
  imports: [NgClass,MatIcon],
})
export class ToggleComponent implements OnInit
{

  @Input() flag: boolean = true;
  @Output() onChange: EventEmitter<boolean> = new EventEmitter();

  constructor() { }

  ngOnInit(): void
  {
  }

  cambio()
  {
    this.flag = !this.flag;
    this.onChange.emit(this.flag);
  }

}
