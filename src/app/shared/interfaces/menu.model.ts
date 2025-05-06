export interface SubMenuItem {
    idSubI: number;
    nameSubI: string;
    link: string;
  }
  
  export interface MenuItem {
    idModule: number;
    moduleName: string;
    subI: SubMenuItem[];
  }