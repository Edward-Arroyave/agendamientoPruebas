import { FormControl, FormGroup } from '@angular/forms';

export class FieldErrors
{
  // Definir un Index Signature para que TypeScript permita el acceso a las propiedades de errorMessages
  private errorMessages: { [key: string]: string} = {
    'required': 'Campo vacío',
    'email': 'Email no válido',
    'emailinvalid': 'Email no válido',
    'EmailExist': 'Correo electrónico existente',
    'Equals': 'Las contraseñas no coinciden',
    'oldPassword': 'La contraseña antigua no coincide con la registrada',
    'password1': 'La contraseña no puede ser igual a la registrada',
    'UserNotExist': 'Usuario no existe',
    'IdentificationExists': 'Tipo y número de identificación ya existen',
    'UserExists': 'Usuario ya existente',
    'MenuExists': 'Nombre Menú ya existente',
    'FechaNacimientoInvalida': 'Fecha no válida',
    'registrationNumberExists': 'Número de tarjeta existente',
    'CodeExists': 'El código ya existente',
    'existingName': 'Nombre ya existente',
    'NameCIE10Exists': 'El Nombre ya existe',
    'maxlength': 'El número de caracteres se ha superado',
    'phone': 'Ingrese mínimo 5 y máximo 15 dígitos',
    'selector': 'Error: sin selección',
    'dateExpiration': 'Fecha inválida',
    'combinationExist': 'El código ya existe',
    'NITExist': 'El NIT ya existe',
    'NameGen': 'El nombre del gen no es válido',
    'NameGenExist': 'Valor ya existente',
    'NameCity': 'Nombre ya asociado a la ciudad',
    'ColorExist': 'El color del gen ya existe',
    'nameTipoMuestraExist': 'Nombre de tipo de muestra ya ha sido registrado',
    'nameTecnicaExist':'Tecnica con nombre ya se encuentra registrado',
    'nameSeccionExist':'Seccion con nombre ya se encuentra registrado',
    'codeTipoM':'Codigo de tipo de muestra ya ha sido registrado',
    'invalid': 'Valor no válido',
    'identificationNumber': 'Campo invalido',
    'rangeDigits': 'Campo invalido',
    'onlyNumbers': 'Solo se permiten números',
    'captchaError': 'CAPTCHA inválido',
    'telefono': 'Máximo 20 o Mínimo 1 caracteres',
    'errorAuth': 'Autorización duplicada',
    'invalidPassword': 'Mínimo 8 caracteres incluyendo mayúsculas, minúsculas, números y caracteres especiales',
    'maxLengthExceeded': 'Validar longitud máxima (30)',
    'max': 'Validar maxímo (30)',
    'min': ' -_- ',
    'invalidChars': 'Validar caracteres asignados',
    'EqualsEmail': 'El correo electrónico no coincide',
    'minlength': 'Ingrese más información',
    'passwordLength': 'Debe estar entre 8 a 16 caracteres',
    'missingUppercase': 'Falta una mayúscula',
    'missingLowercase': 'Falta una minúscula',
    'missingNumber': 'Falta un número',
    'missingSpecialChar': 'Falta un caracterter especial',
  };

  /* Clase que retorna texto errores campos */
  getFormFieldError({ form, formControlName = '', control }: { form?: FormGroup | null, formControlName?: string, control?: FormControl<any> | null } = {}): string {
    const formField = control || (form?.get(formControlName) as FormControl);

    /**Switch para controlar los Mjs en datos demograficos */
    switch (formControlName)
    {
      case 'telefono':
        return 'Mínimo 7 caracteres';
      case 'correoElectronico':
        return 'Email no válido';
      case 'autorizacion':
        return 'Máximo 400 caracteres';
      case 'nombreCompleto':
        return 'Máximo 60 caracteres';
      case 'apellidoCompleto':
        return 'Máximo 60 caracteres';
      case 'direccion':
        return 'Máximo 60 caracteres';
      default:
        break;
    }

    if (formField?.errors) {
      for (const error in formField.errors) {
        const valorError:any = form?.get(formControlName)?.errors;
        if (this.errorMessages[error]) {
          if (error === 'pattern') {
            const patternMessages: { [key: string]: string } = {
              'correoElectronico': 'El formato del correo electrónico no es válido',
              'pass': 'La constraseña debe tener mínimo 8 letras, 1 mayúscula, 1 minúscula, 1 caracter especial y 1 número',
              // Agregar otros formControlName y sus mensajes específicos aquí
            };
            return patternMessages[formControlName] || 'Información inválida';
          }
          if(error === 'min') this.errorMessages[error] = `Validar valor mínimo (${valorError.min.min})`
          if(error === 'max') this.errorMessages[error] = `Validar valor maxímo (${valorError.max.max})`
          return this.errorMessages[error];
        }
      }
    }

    // Agrega un mensaje predeterminado si el error no se encuentra en el objeto errorMessages
    return 'Validar campo--';
  }
}
