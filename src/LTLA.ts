import { LogUpTs, Transport, InternalLogUpTsOptions } from 'logupts/dist/umd/logupts';
import { LogUpTsTransportFile } from 'logupts/dist/umd/logupts-transport-file';
import  LivingSDK, {Auth_Token, LivingApi, LAPIRecord, LivingAPIOptions} from 'livingsdk/dist/umd/livingsdk'
import * as http from 'http';
import * as process from 'process';
import * as path from 'path';
import express = require('express');
import * as nodemailer from 'nodemailer';

export default class Loguptstransportlivingapps implements Transport {
	public key: string;
	static counter: number = 0;
	private argv: string[];

	private logger: LogUpTs;
	private appId: string;
	constructor(livingAppsConfig: LTLA_LAConfig, public staticData: any , public toPrint: string[], 
		private reportMail: string, private mailSettings: {auth:{user: string, pass: string}, host: string, port: number, secure: boolean},
		private lsdk: LivingSDK
	) {
		// store all arguments
		this.argv = process.argv;
		this.logger = new LogUpTs({
			quiet: this.argv.indexOf('--LTLA-debug') < 0,
			prefix: 'LTLA-DEBUG {{service}} {{hours}}.{{minutes}}.{{seconds}}: ',
			transports: []
		})
		if (this.argv.indexOf('--LTLA-save') >= 0) {
			(this.logger.loguptsOptions.transports || []).push(
				new LogUpTsTransportFile(path.resolve(__dirname, '../log'), '{{date}}_{{month}}.log', this.logger, ['ALL'])
			)
		}
		// set key and increase counter
		this.key = `LTLA${Loguptstransportlivingapps.counter}`;
		++Loguptstransportlivingapps.counter;
		this.logger.info("created key")
		this.logger.info("created livingapps instance");
		this.appId = livingAppsConfig.appId;

	}
	async exec(transportOptions: InternalLogUpTsOptions, str: string){
		this.logger.info('start execution');
		let send: boolean = false;
		for (let i of this.toPrint) {
			if ((transportOptions.groups || []).indexOf(i) >= 0) {
				send = true;
				this.logger.info("send message");
				break;
			}
		}
		if (!send) {
			this.logger.info('finished execution');
			return
		};
		let LAAPI = await this.lsdk.get(this.appId);
		this.logger.info('loaded living template from livingapps');
		(<any>transportOptions).transport = (<any>transportOptions).transport ||{};
		(<any>transportOptions).transport.laTransport = (<any>transportOptions).transport.laTransport || {};
		for(let key in this.staticData) {
			(<any>transportOptions).transport.laTransport[key] =  (<any>transportOptions).transport.laTransport[key] || this.staticData[key];
		}
		(<any>transportOptions).transport.laTransport.message = str;
		console.log((<any>transportOptions).transport.laTransport)
		return LAAPI.get('datasources').get('default').app.insert((<any>transportOptions).transport.laTransport)
			.then((record: any) => {
				this.logger.info('inserted record');
				this.logger.info('finished execution');
				return record;
			})
			.catch((error: any) => {
				this.logger.info("sending message to livingapps failed, send mail instead");
				return new Promise((resolve, reject) => {
					nodemailer.createTestAccount((err: Error | null, account: nodemailer.TestAccount) => {
						let transporter: nodemailer.Transporter = nodemailer.createTransport(this.mailSettings);

						let mailOptions: nodemailer.SendMailOptions = {
							from: `logupts-Error ${account.user}`,
							to: this.reportMail,
							subject: 'Error',
							text: `Failed to send "${(<any>transportOptions).transport.laTransport.message}" to LivingApps`
						};

					    transporter.sendMail(mailOptions, (error, info) => {
							if (error) {
								this.logger.info("sending mail failed");
								reject(error);
							}
							this.logger.info(`Message sent: ${info.messageId}`);
							// Preview only available when sending through an Ethereal account
							// console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
							this.logger.info("sending mail was a success");
							// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
							// Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
							resolve();
						});
					});
				});
			})
	}
}

export interface LTLA_LAConfig {
	username: string;
	password: string;
	appId: string;
}
