interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
  readonly NG_APP_API_DEV: string;
  readonly NG_APP_API_TEST: string;
  readonly NG_APP_API_DEMO: string;
  readonly NG_APP_API_PROD: string;
  readonly NG_APP_ACCESSTOKEN: string;
  readonly NG_APP_MERCADOPAGOKEY: string;
  readonly NG_APP_ACCESSTOKEN_PROD: string;
  readonly NG_APP_MERCADOPAGOKEY_PROD: string;
  readonly NG_APP_CLIENTES_API_HIS: string;
  readonly NG_APP_USER: string;
}

/**
 * @deprecated process.env usage
 * prefer using import.meta.env
 * */
declare var process: {
  env: {
    NG_APP_ENV: string;
    [key: string]: any;
  };
};
