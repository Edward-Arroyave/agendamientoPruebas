
export interface IResponseProcedencia {
    ok:     boolean;
    status: number;
    data:   IProcedencia;
}

export interface IProcedencia {
    idOriginEntity:           number;
    origin:                   string;
    entityName?:               string;
    entity?:                  string;
    description:              string;
    authorizationExpiration:  string;
    medicalOrderExpiration:   string;
    medicalHistoryExpiration: string;
    medicalAuthorization:     boolean;
    medicalOrder:             boolean;
    medicalHistory:           boolean;
    authorizationDate:        boolean;
    medicalOrderDate:         boolean;
    medicalHistoryDate:       boolean;
    
    idUserAction?:             number;
    fullNameUserAction?:       string;
    // creationDate?:             Date;
    // updateDate?:               Date | null;
    active?:                  boolean;
}