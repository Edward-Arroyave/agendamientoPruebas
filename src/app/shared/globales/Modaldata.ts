import { TemplateRef } from "@angular/core";
import { ModalColors } from "../modals/modal-general/modal-general.component";

export class ModalData{
  title?:string;
  titleBold?:any[];
  titleNormal?:any[];
  primerInicio?: boolean;
  info?: string;
  info2?:string;
  image?: string;
  content?: TemplateRef<any>;
  btn?:string;
  btn2?:string;
  color?:ModalColors;
  colorLetter?:ModalColors
  showBtn3?:boolean;
  primaryBtn?:any[];
  secondBtn?:any[];
  thirdBtn?:any[];
  automaticClose?:boolean;
  footer?:boolean;
  message?:string;
  message2?:string;
  type?:string;
}
