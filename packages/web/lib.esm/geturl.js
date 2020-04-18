"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import http from "http";
import https from "https";
import { URL } from "url";
import { Logger } from "@ethersproject/logger";
import { version } from "./_version";
const logger = new Logger(version);
function getResponse(request) {
    return new Promise((resolve, reject) => {
        request.once("response", (resp) => {
            const response = {
                statusCode: resp.statusCode,
                statusMessage: resp.statusMessage,
                headers: Object.keys(resp.headers).reduce((accum, name) => {
                    let value = resp.headers[name];
                    if (Array.isArray(value)) {
                        value = value.join(", ");
                    }
                    accum[name] = value;
                    return accum;
                }, {}),
                body: null
            };
            resp.setEncoding("utf8");
            resp.on("data", (chunk) => {
                if (response.body == null) {
                    response.body = "";
                }
                response.body += chunk;
            });
            resp.on("end", () => {
                resolve(response);
            });
            resp.on("error", (error) => {
                error.response = response;
                reject(error);
            });
        });
        request.on("error", (error) => { reject(error); });
    });
}
export function getUrl(href, options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (options == null) {
            options = {};
        }
        const url = new URL(href);
        const request = {
            method: (options.method || "GET"),
            headers: (options.headers || {}),
        };
        let req = null;
        switch (url.protocol) {
            case "http:": {
                req = http.request(url, request);
                break;
            }
            case "https:":
                req = https.request(url, request);
                break;
            default:
                logger.throwError(`unsupported protocol ${url.protocol}`, Logger.errors.UNSUPPORTED_OPERATION, {
                    protocol: url.protocol,
                    operation: "request"
                });
        }
        if (options.body) {
            req.write(options.body);
        }
        req.end();
        const response = yield getResponse(req);
        return response;
    });
}
