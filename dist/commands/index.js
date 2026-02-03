"use strict";
/**
 * Commands Index
 * All slash commands for the bot
 * @module commands
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.video = exports.music = exports.fun = exports.api = exports.owner = exports.admin = exports.general = exports.CommandCategory = exports.BaseCommand = void 0;
var BaseCommand_js_1 = require("./BaseCommand.js");
Object.defineProperty(exports, "BaseCommand", { enumerable: true, get: function () { return BaseCommand_js_1.BaseCommand; } });
Object.defineProperty(exports, "CommandCategory", { enumerable: true, get: function () { return BaseCommand_js_1.CommandCategory; } });
// Export all command modules
exports.general = __importStar(require("./general/index.js"));
exports.admin = __importStar(require("./admin/index.js"));
exports.owner = __importStar(require("./owner/index.js"));
exports.api = __importStar(require("./api/index.js"));
exports.fun = __importStar(require("./fun/index.js"));
exports.music = __importStar(require("./music/index.js"));
exports.video = __importStar(require("./video/index.js"));
//# sourceMappingURL=index.js.map