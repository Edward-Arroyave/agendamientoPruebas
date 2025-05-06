export interface IPreparation {
    idPreparation: number;
    idCategory: number;
    idSpecialties: number;
    idCharacteristic: number;
    idSpecialCondition: number;
    observations: string;
    preconditions: string;
    indications: string;
    elements: string;
    listRequirements: Requirement[];
    listIdRequirementsToDesactive: number[];
    idUserAction : number;
    fullNameUserAction : string;
    active : boolean;
  }

  export interface Requirement {
    idRequirement: number;
    requirementDescription: string;
    essentialRequirement: boolean;
  }

  export interface PreStatus{
    idPreparation: number;
    active: boolean;
    elements: boolean;
    // idUserAction: number;
  }
