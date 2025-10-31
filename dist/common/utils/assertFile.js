"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertFile = void 0;
const assertFile = (file, mustImage = true) => {
    if (!file)
        throw new BadRequestException('File is required');
    if (file.size > FILE_MAX_SIZE)
        throw new BadRequestException('File too large');
    if (mustImage &&
        !['image/jpeg', 'image/png', 'image/heic', 'image/heif'].includes(file.mimetype)) {
        throw new BadRequestException('Unsupported file type');
    }
};
exports.assertFile = assertFile;
//# sourceMappingURL=assertFile.js.map