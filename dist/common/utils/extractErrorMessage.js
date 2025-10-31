"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractErrorMessage = void 0;
const extractErrorMessage = (data) => {
    if (data == null)
        return undefined;
    if (typeof data === 'string') {
        try {
            const parsed = JSON.parse(data);
            return (0, exports.extractErrorMessage)(parsed) ?? data;
        }
        catch {
            return data;
        }
    }
    if (typeof data !== 'object')
        return undefined;
    const obj = data;
    if (obj.error) {
        const err = obj.error;
        if (typeof err === 'string')
            return err;
        if (typeof err === 'object' && err) {
            return err.message || String(err);
        }
    }
    if (obj.message) {
        const msg = obj.message;
        if (typeof msg === 'string')
            return msg;
        if (typeof msg === 'object' && msg) {
            return msg.message || String(msg);
        }
    }
    return undefined;
};
exports.extractErrorMessage = extractErrorMessage;
//# sourceMappingURL=extractErrorMessage.js.map