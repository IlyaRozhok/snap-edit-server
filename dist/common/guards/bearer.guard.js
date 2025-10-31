"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BearerGuard = void 0;
const common_1 = require("@nestjs/common");
let BearerGuard = class BearerGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];
        const appToken = process.env.APP_BEARER_TOKEN;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('No bearer token');
        }
        const token = authHeader.slice(7);
        if (!appToken || token !== appToken) {
            throw new common_1.UnauthorizedException('Invalid bearer token');
        }
        return true;
    }
};
exports.BearerGuard = BearerGuard;
exports.BearerGuard = BearerGuard = __decorate([
    (0, common_1.Injectable)()
], BearerGuard);
//# sourceMappingURL=bearer.guard.js.map