
export interface IpaymentGateway {
  idPaymentGateway: number;
  urlService: string;
  userName: string;
  password: string;
  idUnitOfTime: number;
  amountOfTime: number;
  particularContractCode: string;
  nameParticularContract: string;
}

export interface ICostoExamen {
  instServiceCode: string
  instServiceName: string
  value: number
}

export interface IInstCode{
  cups:string
}
export interface IGetInstCode{
  instServiceCode:string
  instServiceName:string
  fullValue:string
  checked?: boolean
}

