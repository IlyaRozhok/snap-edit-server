"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateImage = validateImage;
exports.convertHeicToJpeg = convertHeicToJpeg;
exports.resizeByLongestSide = resizeByLongestSide;
exports.processImage = processImage;
const sharp_1 = __importDefault(require("sharp"));
async function validateImage(buffer, mime, maxSizeMB = 50) {
    const allowed = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
    if (!allowed.includes(mime)) {
        throw new Error('Unsupported image type');
    }
    if (buffer.length > maxSizeMB * 1024 * 1024) {
        throw new Error('File size exceeds limit');
    }
}
async function convertHeicToJpeg(buffer) {
    return (0, sharp_1.default)(buffer).jpeg().toBuffer();
}
async function resizeByLongestSide(buffer, maxSide) {
    const img = (0, sharp_1.default)(buffer);
    const metadata = await img.metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    if (width <= maxSide && height <= maxSide)
        return buffer;
    const opts = {};
    if (width >= height) {
        opts.width = maxSide;
    }
    else {
        opts.height = maxSide;
    }
    return img.resize(opts).toBuffer();
}
function isHeic(mime) {
    return (mime === 'image/heic' ||
        mime === 'image/heif' ||
        mime === 'heic' ||
        mime === 'heif');
}
async function processImage(buffer, options) {
    let img = (0, sharp_1.default)(buffer, { failOnError: false });
    let metadata = await img.metadata();
    let mime = metadata.format;
    if (isHeic(mime || '')) {
        const heifSupported = sharp_1.default.format?.heif?.input;
        if (!heifSupported) {
            throw new Error('HEIC/HEIF format not supported by sharp.');
        }
        img = (0, sharp_1.default)(buffer).jpeg();
        metadata = await img.metadata();
        mime = 'jpeg';
    }
    img = img.rotate();
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    const max = options.maxSize;
    let resizeOptions = {};
    if (width > max || height > max) {
        if (width >= height) {
            resizeOptions.width = max;
        }
        else {
            resizeOptions.height = max;
        }
        img = img.resize(resizeOptions);
    }
    img = img.jpeg({ quality: 92, chromaSubsampling: '4:4:4' });
    return img.toBuffer();
}
//# sourceMappingURL=image-processor.js.map