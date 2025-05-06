export interface SubMenuItem {
    IdMenu: number;
    Name: string;
    Crear: boolean;
    Editar: boolean;
    Ver: boolean;
    Eliminar: boolean;
    Expanded: boolean;
    Lvl: number;
  }
  
  export interface MenuItem {
    IdMenu: number;
    Name: string;
    Crear: boolean;
    Editar: boolean;
    Ver: boolean;
    Eliminar: boolean;
    expanded: boolean;
    Lvl: number;
    Children: SubMenuItem[]; 
  }
  
  export interface MenuResponse {
    ok: boolean;
    message: string;
    data: MenuItem[];
  }
  