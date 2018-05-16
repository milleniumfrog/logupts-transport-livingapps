import { Transport, InternalLogUpTsOptions } from 'logupts/dist/umd/logupts';
import LivingSDK from 'livingsdk/dist/umd/livingsdk';
export default class Loguptstransportlivingapps implements Transport {
    staticData: any;
    toPrint: string[];
    private reportMail;
    private mailSettings;
    private lsdk;
    private datasourceID;
    key: string;
    static counter: number;
    private argv;
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
    }, lsdk: LivingSDK, datasourceID?: string);
    exec(transportOptions: InternalLogUpTsOptions, str: string): Promise<void>;
}
export interface LTLA_LAConfig {
    username: string;
    password: string;
    appId: string;
}
