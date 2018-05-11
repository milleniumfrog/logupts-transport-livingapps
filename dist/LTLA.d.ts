import { Transport, InternalLogUpTsOptions } from 'logupts/dist/umd/logupts';
export default class Loguptstransportlivingapps implements Transport {
    staticData: any;
    toPrint: string[];
    private reportMail;
    private mailSettings;
    key: string;
    static counter: number;
    private argv;
    private lsdk;
    private logger;
    private appId;
    constructor(livingAppsConfig: LTLA_LAConfig, staticData: any, toPrint: string[], reportMail: string, mailSettings: {
        auth: {
            user: string;
            pass: string;
        };
        host: string;
        port: number;
        secure: boolean;
    });
    exec(transportOptions: InternalLogUpTsOptions, str: string): Promise<any>;
}
export interface LTLA_LAConfig {
    username: string;
    password: string;
    appId: string;
}
