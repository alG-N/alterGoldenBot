"use strict";
/**
 * Owner Commands - Presentation Layer
 * @module presentation/commands/owner
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.botcheck = void 0;
var botcheck_js_1 = require("./botcheck.js");
Object.defineProperty(exports, "botcheck", { enumerable: true, get: function () { return __importDefault(botcheck_js_1).default; } });
// CommonJS compatibility for command loader
// Handle both `module.exports = cmd` and `export default cmd` patterns
const getCmd = (mod) => mod.default || mod;
module.exports = {
    botcheck: getCmd(require('./botcheck')),
};
//# sourceMappingURL=index.js.map