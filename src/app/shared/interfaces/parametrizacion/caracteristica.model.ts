export interface CharacterResponse {
    ok: boolean;
    message: string;
    data: Character[];
  }
  
  export interface Character {
      idCharacteristic: number;
      idIconSpecialties: number;
      particularTime: number;
      characteristicName: string;
      specialtiesName: string;
      idSpecialties: number;
      active: boolean;
      medicalAuthorization: boolean;
      idUserAction: number;
      fullNameUserAction?:string;
      isElementRequired?:boolean;
      associatedExam?:boolean;
    }
  
    export interface CharacterStatus{
      id: number;
      status: boolean;
      idUserAction: number;
    }
    