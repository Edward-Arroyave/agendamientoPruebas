import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export function passwordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.value;


    if (password) {
      // Condiciones de la contraseña
      if (password.length < 8 || password.length > 16) {
        return { passwordLength: true };  // Longitud incorrecta
      }
      if ( !/[A-Z]/.test(password)) {
        return { missingUppercase: true };  // Falta mayúscula
      }
      if (!/[a-z]/.test(password)) {
        return { missingLowercase: true };  // Falta minúscula
      }
      if ( !/\d/.test(password)) {
        return { missingNumber: true };  // Falta número
      }
      if (!/[\W_]/.test(password)) {
        return { missingSpecialChar: true };  // Falta carácter especial
      }
    }



    return null;  // Si no hay errores
  };
}
