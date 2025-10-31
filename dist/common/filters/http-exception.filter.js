"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let HttpExceptionFilter = class HttpExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let code = 'UPSTREAM_ERROR';
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const errRes = exception.getResponse();
            if (typeof errRes === 'object' && errRes.message) {
                message = errRes.message;
            }
            else if (typeof errRes === 'string') {
                message = errRes;
            }
            else {
                message = exception.message;
            }
            switch (status) {
                case 400:
                case 422:
                    code = 'VALIDATION_ERROR';
                    break;
                case 401:
                    code = 'AUTH_ERROR';
                    break;
                case 429:
                    code = 'QUEUE_OVERLOADED';
                    break;
                case 408:
                    code = 'TIMEOUT';
                    break;
                default:
                    code = 'UPSTREAM_ERROR';
            }
        }
        else if (exception && typeof exception === 'object') {
            message = exception.message || message;
            if (exception.code) {
                code = exception.code;
            }
        }
        else if (typeof exception === 'string') {
            message = exception;
        }
        response.status(status).json({
            error: {
                code,
                message,
            },
        });
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map