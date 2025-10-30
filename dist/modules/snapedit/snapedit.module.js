"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnapEditModule = void 0;
const common_1 = require("@nestjs/common");
const snapedit_client_service_1 = require("./snapedit-client.service");
const snapedit_controller_1 = require("./snapedit.controller");
let SnapEditModule = class SnapEditModule {
};
exports.SnapEditModule = SnapEditModule;
exports.SnapEditModule = SnapEditModule = __decorate([
    (0, common_1.Module)({
        controllers: [snapedit_controller_1.SnapEditController],
        providers: [snapedit_client_service_1.SnapEditClient],
        exports: [snapedit_client_service_1.SnapEditClient],
    })
], SnapEditModule);
//# sourceMappingURL=snapedit.module.js.map