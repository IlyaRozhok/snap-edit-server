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
const sharp_1 = __importDefault(require("sharp"));
const extractErrorMessage_1 = require("../../common/utils/extractErrorMessage");
const image_processor_1 = require("../../common/utils/image-processor");
const ENDPOINTS = {
    autoSuggest: '/object_removal/v1/auto_suggest',
    erase: '/object_removal/v1/erase',
    superErase: '/object_removal/v1/super_erase',
    save: '/object_removal/v1/save',
    enhance: '/image_enhancement/v1/enhance',
    removeBg: '/background_removal/v1/erase',
};
function toUpstreamError(e) {
    const fallback = 'SnapEdit upstream error';
    const data = e?.response?.data;
    const messageFromData = (0, extractErrorMessage_1.extractErrorMessage)(data);
    const message = messageFromData || e?.message || fallback;
    const err = new Error(message);
    err.response = e?.response;
    err.code = 'UPSTREAM_ERROR';
    throw err;
}
async function normalizeLargeToJpeg4000(buf, mime) {
    let b = buf;
    if (mime && /heic|heif/i.test(mime)) {
        b = await (0, image_processor_1.convertHeicToJpeg)(b);
    }
    b = await (0, image_processor_1.resizeByLongestSide)(b, 4000);
    b = await (0, sharp_1.default)(b)
        .rotate()
        .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
        .toBuffer();
    return b;
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
    async save(image, sessionId, previewMaskFile, previewImageToSave, originalLargeImage) {
        const fd = new form_data_1.default();
        if (image && image.length > 0) {
            const previewBuf = await (0, sharp_1.default)(image)
                .rotate()
                .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
                .toBuffer();
            fd.append('original_preview_image', previewBuf, {
                filename: 'preview.jpg',
                contentType: 'image/jpeg',
            });
        }
        const maskBuf = await (0, sharp_1.default)(previewMaskFile).ensureAlpha().png().toBuffer();
        const maskBase64 = maskBuf.toString('base64');
        fd.append('preview_mask_to_save', maskBase64);
        if (!sessionId) {
            if (!previewImageToSave || previewImageToSave.length === 0) {
                throw new Error('preview_image_to_save is required when session_id is not provided');
            }
            const prevResized = await (0, sharp_1.default)(previewImageToSave)
                .rotate()
                .resize({
                width: 1200,
                height: 1200,
                fit: 'inside',
                withoutEnlargement: true,
            })
                .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
                .toBuffer();
            fd.append('preview_image_to_save', prevResized, {
                filename: 'preview_result.jpg',
                contentType: 'image/jpeg',
            });
        }
        else if (previewImageToSave && previewImageToSave.length > 0) {
            const prevResized = await (0, sharp_1.default)(previewImageToSave)
                .rotate()
                .resize({
                width: 1200,
                height: 1200,
                fit: 'inside',
                withoutEnlargement: true,
            })
                .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
                .toBuffer();
            fd.append('preview_image_to_save', prevResized, {
                filename: 'preview_result.jpg',
                contentType: 'image/jpeg',
            });
        }
        if (!originalLargeImage?.buffer) {
            throw new Error('original_large_image file buffer missing');
        }
        const largeJpeg = await normalizeLargeToJpeg4000(originalLargeImage.buffer, originalLargeImage.mimetype);
        const largeBase64 = largeJpeg.toString('base64');
        fd.append('original_large_image', largeBase64);
        if (sessionId) {
            fd.append('session_id', sessionId);
        }
        try {
            const headers = { ...fd.getHeaders(), ...this.getHeaders() };
            console.log('SAVE request fields:', {
                hasOriginalPreview: image && image.length > 0,
                hasPreviewMask: previewMaskFile && previewMaskFile.length > 0,
                hasPreviewImageToSave: previewImageToSave && previewImageToSave.length > 0,
                hasOriginalLarge: originalLargeImage?.buffer && originalLargeImage.buffer.length > 0,
                hasSessionId: !!sessionId,
            });
            const res = await axios_1.default.post(this.baseUrl + ENDPOINTS.save, fd, {
                headers,
                timeout: 120_000,
            });
            return res.data;
        }
        catch (e) {
            console.error('SAVE error detail:', {
                status: e?.response?.status,
                statusText: e?.response?.statusText,
                data: e?.response?.data,
                headers: e?.response?.headers,
            });
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