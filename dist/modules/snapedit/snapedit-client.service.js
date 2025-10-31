"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnapEditClient = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const ENDPOINTS = {
    autoSuggest: '/object_removal/v1/auto_suggest',
    erase: '/object_removal/v1/erase',
    superErase: '/object_removal/v1/super_erase',
    save: '/object_removal/v1/save',
    enhance: '/image_enhancement/v1/enhance',
    removeBg: '/background_removal/v1/erase',
};
function toUpstreamError(e) {
    let message = 'SnapEdit upstream error';
    if (e.response && e.response.data) {
        const data = e.response.data;
        if (typeof data === 'string') {
            try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                    message = typeof parsed.error === 'string'
                        ? parsed.error
                        : parsed.error.message || parsed.error;
                }
                else {
                    message = data;
                }
            }
            catch {
                message = data;
            }
        }
        else if (typeof data === 'object') {
            if (data.error) {
                message = typeof data.error === 'string'
                    ? data.error
                    : data.error.message || String(data.error);
            }
            else if (data.message) {
                message = data.message;
            }
            else {
                message = 'SnapEdit upstream error';
            }
        }
    }
    else if (e.message) {
        message = e.message;
    }
    const err = new Error(message);
    err.response = e.response;
    err.code = 'UPSTREAM_ERROR';
    throw err;
}
let SnapEditClient = class SnapEditClient {
    constructor() {
        this.baseUrl = process.env.APP_SNAPEDIT_BASE_URL;
        this.apiKey = process.env.APP_SNAPEDIT_API_KEY;
        if (!this.apiKey) {
            throw new common_1.InternalServerErrorException('SnapEdit API key is not configured. Set SNAPEDIT_API_KEY in .env');
        }
    }
    getHeaders() {
        return { 'X-API-KEY': this.apiKey };
    }
    async autoSuggest(image, sessionId) {
        const fd = new form_data_1.default();
        fd.append('original_preview_image', image, {
            filename: 'image.jpg',
            contentType: 'image/jpeg',
        });
        if (sessionId)
            fd.append('session_id', sessionId);
        try {
            const res = await axios_1.default.post(this.baseUrl + ENDPOINTS.autoSuggest, fd, {
                headers: { ...fd.getHeaders(), ...this.getHeaders() },
                timeout: 60000,
            });
            return res.data;
        }
        catch (e) {
            toUpstreamError(e);
        }
    }
    async erase(image, maskBrush, sessionId, maskBase) {
        const fd = new form_data_1.default();
        fd.append('image', image, { filename: 'image.jpg' });
        fd.append('mask_brush', maskBrush, { filename: 'mask_brush.png' });
        if (sessionId)
            fd.append('session_id', sessionId);
        console.log(fd);
        if (maskBase)
            fd.append('mask_base', maskBase, { filename: 'mask_base.png' });
        try {
            const res = await axios_1.default.post(this.baseUrl + ENDPOINTS.erase, fd, {
                headers: { ...fd.getHeaders(), ...this.getHeaders() },
                timeout: 120000,
            });
            return res.data;
        }
        catch (e) {
            toUpstreamError(e);
        }
    }
    async save(sessionId) {
        const fd = new form_data_1.default();
        fd.append('session_id', sessionId);
        try {
            const res = await axios_1.default.post(this.baseUrl + ENDPOINTS.save, fd, {
                headers: { ...fd.getHeaders(), ...this.getHeaders() },
                timeout: 120000,
            });
            return res.data;
        }
        catch (e) {
            toUpstreamError(e);
        }
    }
    async enhance(image, quality) {
        const fd = new form_data_1.default();
        fd.append('image', image, { filename: 'image.jpg' });
        fd.append('quality', quality);
        try {
            const res = await axios_1.default.post(this.baseUrl + ENDPOINTS.enhance, fd, {
                headers: { ...fd.getHeaders(), ...this.getHeaders() },
                timeout: 120000,
            });
            return res.data;
        }
        catch (e) {
            toUpstreamError(e);
        }
    }
    async removeBg(image) {
        const fd = new form_data_1.default();
        fd.append('input_image', image, {
            filename: 'image.jpg',
            contentType: 'image/jpeg',
        });
        console.log(fd);
        try {
            const res = await axios_1.default.post(this.baseUrl + ENDPOINTS.removeBg, fd, {
                headers: { ...fd.getHeaders(), ...this.getHeaders() },
                timeout: 60000,
            });
            return res.data;
        }
        catch (e) {
            toUpstreamError(e);
        }
    }
};
exports.SnapEditClient = SnapEditClient;
exports.SnapEditClient = SnapEditClient = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SnapEditClient);
//# sourceMappingURL=snapedit-client.service.js.map