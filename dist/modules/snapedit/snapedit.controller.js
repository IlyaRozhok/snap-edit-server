"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnapEditController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const bearer_guard_1 = require("../../common/guards/bearer.guard");
const snapedit_client_service_1 = require("./snapedit-client.service");
const multer = __importStar(require("multer"));
const queue_1 = require("../../common/utils/queue");
const retry_1 = require("../../common/utils/retry");
const image_processor_1 = require("../../common/utils/image-processor");
const FILE_MAX_SIZE = 50 * 1024 * 1024;
function assertFile(file, mustImage = true) {
    if (!file)
        throw new common_1.BadRequestException('File is required');
    if (file.size > FILE_MAX_SIZE)
        throw new common_1.BadRequestException('File too large');
    if (mustImage &&
        !['image/jpeg', 'image/png', 'image/heic', 'image/heif'].includes(file.mimetype)) {
        throw new common_1.BadRequestException('Unsupported file type');
    }
}
let SnapEditController = class SnapEditController {
    constructor(client) {
        this.client = client;
    }
    async autoSuggest(file, sessionId) {
        assertFile(file, true);
        const image = await (0, image_processor_1.processImage)(file.buffer, { maxSize: 1200 });
        return (0, queue_1.runWithLimit)(() => (0, retry_1.withRetry)(() => this.client.autoSuggest(image, sessionId)));
    }
    async erase(files, body) {
        const image = files.find((f) => f.fieldname === 'image');
        const maskBrush = files.find((f) => f.fieldname === 'mask_brush');
        assertFile(image, true);
        assertFile(maskBrush, false);
        const imgProcessed = await (0, image_processor_1.processImage)(image.buffer, { maxSize: 1200 });
        console.log('imgProcessedsed', imgProcessed);
        return (0, queue_1.runWithLimit)(() => (0, retry_1.withRetry)(() => this.client.erase(imgProcessed, maskBrush.buffer, body.session_id)));
    }
    async save(files, body) {
        const { session_id } = body;
        const maskFile = files.find((f) => f.fieldname === 'preview_mask_to_save');
        const originalLargeImage = files.find((f) => f.fieldname === 'original_large_image');
        const previewImageFile = files.find((f) => f.fieldname === 'preview_image_to_save');
        const originalPreviewImage = files.find((f) => f.fieldname === 'original_preview_image');
        if (!maskFile)
            throw new common_1.BadRequestException('preview_mask_to_save file is required');
        if (!originalLargeImage)
            throw new common_1.BadRequestException('original_large_image is required');
        if (!session_id && !previewImageFile) {
            throw new common_1.BadRequestException('preview_image_to_save is required when session_id is not provided');
        }
        const processedPreview = originalPreviewImage
            ? await (0, image_processor_1.processImage)(originalPreviewImage.buffer, { maxSize: 1200 })
            : undefined;
        const previewImageToSave = previewImageFile
            ? await (0, image_processor_1.processImage)(previewImageFile.buffer, { maxSize: 1200 })
            : undefined;
        return (0, queue_1.runWithLimit)(() => (0, retry_1.withRetry)(() => this.client.save(processedPreview || Buffer.alloc(0), session_id || '', maskFile.buffer, previewImageToSave || Buffer.alloc(0), originalLargeImage)));
    }
    async enhance(file, quality = 'fine') {
        assertFile(file, true);
        const maxSize = 3000;
        const image = await (0, image_processor_1.processImage)(file.buffer, { maxSize });
        if (quality !== 'fine' && quality !== 'ultra')
            throw new common_1.BadRequestException('Invalid quality');
        return (0, queue_1.runWithLimit)(() => (0, retry_1.withRetry)(() => this.client.enhance(image, quality)));
    }
    async removeBg(file) {
        assertFile(file, true);
        const image = await (0, image_processor_1.processImage)(file.buffer, { maxSize: 1200 });
        return (0, queue_1.runWithLimit)(() => (0, retry_1.withRetry)(() => this.client.removeBg(image)));
    }
};
exports.SnapEditController = SnapEditController;
__decorate([
    (0, common_1.Post)('auto-suggest'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', { storage: multer.memoryStorage() })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('session_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SnapEditController.prototype, "autoSuggest", null);
__decorate([
    (0, common_1.Post)('erase'),
    (0, common_1.UseInterceptors)((0, platform_express_1.AnyFilesInterceptor)({ storage: multer.memoryStorage() })),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", Promise)
], SnapEditController.prototype, "erase", null);
__decorate([
    (0, common_1.Post)('save'),
    (0, common_1.UseInterceptors)((0, platform_express_1.AnyFilesInterceptor)({ storage: multer.memoryStorage() })),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", Promise)
], SnapEditController.prototype, "save", null);
__decorate([
    (0, common_1.Post)('enhance'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', { storage: multer.memoryStorage() })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('quality')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SnapEditController.prototype, "enhance", null);
__decorate([
    (0, common_1.Post)('remove-bg'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', { storage: multer.memoryStorage() })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SnapEditController.prototype, "removeBg", null);
exports.SnapEditController = SnapEditController = __decorate([
    (0, common_1.Controller)('v1'),
    (0, common_1.UseGuards)(bearer_guard_1.BearerGuard),
    __metadata("design:paramtypes", [snapedit_client_service_1.SnapEditClient])
], SnapEditController);
//# sourceMappingURL=snapedit.controller.js.map