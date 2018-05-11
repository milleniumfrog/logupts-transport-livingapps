var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "logupts/dist/umd/logupts", "logupts/dist/umd/logupts-transport-file", "process", "path", "nodemailer"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const logupts_1 = require("logupts/dist/umd/logupts");
    const logupts_transport_file_1 = require("logupts/dist/umd/logupts-transport-file");
    const process = __importStar(require("process"));
    const path = __importStar(require("path"));
    const nodemailer = __importStar(require("nodemailer"));
    class Loguptstransportlivingapps {
        constructor(livingAppsConfig, staticData, toPrint, reportMail, mailSettings, lsdk) {
            this.staticData = staticData;
            this.toPrint = toPrint;
            this.reportMail = reportMail;
            this.mailSettings = mailSettings;
            this.lsdk = lsdk;
            // store all arguments
            this.argv = process.argv;
            this.logger = new logupts_1.LogUpTs({
                quiet: this.argv.indexOf('--LTLA-debug') < 0,
                prefix: 'LTLA-DEBUG {{service}} {{hours}}.{{minutes}}.{{seconds}}: ',
                transports: []
            });
            if (this.argv.indexOf('--LTLA-save') >= 0) {
                (this.logger.loguptsOptions.transports || []).push(new logupts_transport_file_1.LogUpTsTransportFile(path.resolve(__dirname, '../log'), '{{date}}_{{month}}.log', this.logger, ['ALL']));
            }
            // set key and increase counter
            this.key = `LTLA${Loguptstransportlivingapps.counter}`;
            ++Loguptstransportlivingapps.counter;
            this.logger.info("created key");
            this.logger.info("created livingapps instance");
            this.appId = livingAppsConfig.appId;
        }
        exec(transportOptions, str) {
            return __awaiter(this, void 0, void 0, function* () {
                this.logger.info('start execution');
                let send = false;
                for (let i of this.toPrint) {
                    if ((transportOptions.groups || []).indexOf(i) >= 0) {
                        send = true;
                        this.logger.info("send message");
                        break;
                    }
                }
                if (!send) {
                    this.logger.info('finished execution');
                    return;
                }
                ;
                let LAAPI = yield this.lsdk.get(this.appId);
                this.logger.info('loaded living template from livingapps');
                transportOptions.transport = transportOptions.transport || {};
                transportOptions.transport.laTransport = transportOptions.transport.laTransport || {};
                for (let key in this.staticData) {
                    transportOptions.transport.laTransport[key] = transportOptions.transport.laTransport[key] || this.staticData[key];
                }
                transportOptions.transport.laTransport.message = str;
                console.log(transportOptions.transport.laTransport);
                return LAAPI.get('datasources').get('default').app.insert(transportOptions.transport.laTransport)
                    .then((record) => {
                    this.logger.info('inserted record');
                    this.logger.info('finished execution');
                    return record;
                })
                    .catch((error) => {
                    this.logger.info("sending message to livingapps failed, send mail instead");
                    return new Promise((resolve, reject) => {
                        nodemailer.createTestAccount((err, account) => {
                            let transporter = nodemailer.createTransport(this.mailSettings);
                            let mailOptions = {
                                from: `logupts-Error ${account.user}`,
                                to: this.reportMail,
                                subject: 'Error',
                                text: `Failed to send "${transportOptions.transport.laTransport.message}" to LivingApps`
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
                });
            });
        }
    }
    Loguptstransportlivingapps.counter = 0;
    exports.default = Loguptstransportlivingapps;
});
