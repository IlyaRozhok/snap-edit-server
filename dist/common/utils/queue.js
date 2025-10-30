"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWithLimit = runWithLimit;
const p_limit_1 = __importDefault(require("p-limit"));
const limit = (0, p_limit_1.default)(5);
async function runWithLimit(fn) {
    return limit(fn);
}
//# sourceMappingURL=queue.js.map