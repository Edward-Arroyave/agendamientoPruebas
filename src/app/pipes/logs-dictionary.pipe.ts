import { Pipe, PipeTransform } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Pipe({
  name: 'DictionaryLogs',
  standalone: true
})
export class DictionaryLogsPipe implements PipeTransform {

  dictionary:any;
  repeatedKey:string[]= ['idUserAction','fullNameUserAction','description']

  constructor(private http:HttpClient){}

  lowercaseFirstLetter(value:string) {
    if (!value) return value; // Maneja casos de cadenas vacías o nulas
    return value.charAt(0).toLowerCase() + value.slice(1);
  }

  async transform(value: string): Promise<any> {
    value = this.lowercaseFirstLetter(value);
    await lastValueFrom(this.http.get('assets/dictionary/dictionary-log.json'))
          .then(x =>this.dictionary = x).catch(e =>e);

    return new Promise((resp,error) =>{
      if(value){
        if(!this.dictionary[value]) {
          console.error('No se encontro la llave: ',value);
          resp(value);
        }
        resp(this.dictionary[value]);
      }
      resp('-');
    })
  }
}