export const environment = {
    produccion:true,
    apiEndPointDev: import.meta.env.NG_APP_API_DEV,
    apiEndPointTest: import.meta.env.NG_APP_API_TEST,//? Ambiente: Pruebas
    apiEndPointDemo: import.meta.env.NG_APP_API_DEMO, //? Ambiente: Demo
    apiEndPointProd: import.meta.env.NG_APP_API_PROD, //? Ambiente: Producción
    mercadoPagoKey:import.meta.env.NG_APP_MERCADOPAGOKEY,
    version:'1'
};
