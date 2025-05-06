export interface IPreferencia {
    id:                 string;
    title:              string;
    description:        string;
    pictureUrl?:         string;
    categoryId?:         string;
    quantity?:           number;
    unitPrice:          number;
    currencyId?:         string;
    categoryDescriptor?: CategoryDescriptor;
    warranty?:           boolean;
    eventDate:         Date;
}

export interface CategoryDescriptor {
    passenger: Passenger;
    route:     Route;
}

export interface Passenger {
    firstName:      string;
    lastName:       string;
    identification: Identification;
}

export interface Identification {
    type:   string;
    number: string;
}

export interface Route {
    departure:         string;
    destination:       string;
    departureDateTime: Date;
    arrivalDateTime:   Date;
    company:           string;
}


// Pagos

export interface ICrearPago {
    id:                  string;
    items:               Item[];
    payer:               Payer;
    paymentMethods?:      PaymentMethods;
    backUrls:            BackUrls;
    shipments?:           Shipments;
    notificationUrl:     null;
    statementDescriptor?: null;
    externalReference?:   string;
    expires:             boolean;
    dateOfExpiration?:    Date;
    expirationDateFrom?:  Date;
    expirationDateTo?:    Date;
    collectorId?:         number;
    marketplace?:         string;
    marketplaceFee?:      number;
    purpose?:             null;
    additionalInfo?:      string;
    autoReturn?:          string;
    operationType?:       string;
    differentialPricing?: null;
    sponsorId?:           null;
    processingModes?:     null;
    binaryMode?:          boolean;
    taxes?:               null;
    tracks?:              null;
    metadata?:            Metadata;
    initPoint?:           string;
    sandboxInitPoint?:    string;
    dateCreated?:         Date;
    apiResponse?:         APIResponse;
}

export interface APIResponse {
    statusCode: number;
    headers:    Headers;
    content:    string;
}

export interface Headers {
    Date:                           string;
    Connection:                     string;
    "X-Content-Type-Options":       string;
    "X-Request-ID":                 string;
    "X-XSS-Protection":             string;
    "Strict-Transport-Security":    string;
    "Access-Control-Allow-Origin":  string;
    "Access-Control-Allow-Headers": string;
    "Access-Control-Allow-Methods": string;
    "Access-Control-Max-Age":       string;
    "Timing-Allow-Origin":          string;
}

export interface BackUrls {
    success: string;
    pending: string;
    failure: string;
}

export interface Item {
    id:                 string;
    title:              string;
    description:        string;
    pictureUrl:         null;
    categoryId:         string;
    quantity:           number;
    unitPrice:          number;
    currencyId:         string;
    categoryDescriptor: null;
    warranty:           null;
    eventDate:          null;
}

export interface Metadata {
}

export interface Payer {
    name:                  string;
    surname:               string;
    email:                 string;
    phone:                 Phone;
    identification:        Identification;
    address:               Address;
    dateCreated:           null;
    authenticationType:    null;
    isPrimeUser:           null;
    isFirstPurchaseOnline: null;
    lastPurchase:          null;
}

export interface Address {
    zipCode:      string;
    streetName:   string;
    streetNumber: null;
}

export interface Identification {
    type:   string;
    number: string;
}

export interface Phone {
    areaCode: string;
    number:   string;
}

export interface PaymentMethods {
    excludedPaymentMethods: ExcludedPayment[];
    excludedPaymentTypes:   ExcludedPayment[];
    defaultPaymentMethodId: null;
    installments:           null;
    defaultInstallments:    null;
}

export interface ExcludedPayment {
    id: string;
}

export interface Shipments {
    mode:                  null;
    localPickup:           null;
    dimensions:            null;
    defaultShippingMethod: null;
    freeMethods:           null;
    cost:                  null;
    freeShipping:          null;
    receiverAddress:       ReceiverAddress;
    expressShipment:       null;
}

export interface ReceiverAddress {
    country:      null;
    state:        null;
    city:         null;
    floor:        string;
    apartment:    string;
    zipCode:      string;
    streetName:   string;
    streetNumber: null;
}

// export interface IStatusMercadoPago{
//     collection_id : number;  
//     collection_status : string;  
//     payment_id : number;  
//     status : string;  
//     external_reference : string;  
//     payment_type : string;  
//     merchant_order_id : number;  
//     preference_id : string;  
//     merchant_account_id : number;  
//     processing_mode : string;  
//     idNotificacion : number;  
// }

export interface IStatusMercadoPago {
    id?: number;
    dateCreated?: Date;
    dateApproved?: Date;
    dateLastUpdated?: Date;
    dateOfExpiration?: Date;
    moneyReleaseDate?: Date;
    operationType?: string;
    issuerId?: string;
    paymentMethodId?: string;
    paymentTypeId?: string;
    status?: string;
    statusDetail?: string;
    currencyId?: string;
    description?: string;
    liveMode?: boolean;
    sponsorId?: number;
    authorizationCode?: string;
    integratorId?: string;
    platformId?: string;
    corporationId?: string;
    collectorId?: number;
    externalReference?: string;
    transactionAmount?: number;
    transactionAmountRefunded?: number;
    couponAmount?: number;
    differentialPricingId?: number;
    installments?: number;
    captured?: boolean;
    binaryMode?: boolean;
    callForAuthorizeId?: string;
    statementDescriptor?: string;
    notificationUrl?: string;
    callbackUrl?: string;
    processingMode?: string;
    merchantAccountId?: string;
    campaignId?: number;
    couponCode?: string;
    netAmount?: number;
    paymentMethodOptionId?: string;
    internalMetadata?: Record<string, any>;
    additionalInfo?:PaymentAdditionalInfo
  }

  export interface PaymentAdditionalInfo{
    items: PaymentItem []
  }

  export interface PaymentItem {
    id?: string;
    title?: string;
    description?: string;
    pictureUrl?: string;
    categoryId?: string;
    quantity?: number;
    unitPrice?: number;
  }
  
