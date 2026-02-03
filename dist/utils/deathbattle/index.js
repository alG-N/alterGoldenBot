"use strict";
/**
 * DeathBattle Utilities Index
 * @module utils/deathbattle
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
exports.DeathBattleLogger = exports.DeathBattleEmbedBuilder = exports.logger = exports.deathBattleLogger = exports.embedBuilder = exports.deathBattleEmbedBuilder = void 0;
const embedBuilder_js_1 = __importStar(require("./embedBuilder.js"));
exports.deathBattleEmbedBuilder = embedBuilder_js_1.default;
exports.embedBuilder = embedBuilder_js_1.default;
Object.defineProperty(exports, "DeathBattleEmbedBuilder", { enumerable: true, get: function () { return embedBuilder_js_1.DeathBattleEmbedBuilder; } });
const logger_js_1 = __importStar(require("./logger.js"));
exports.deathBattleLogger = logger_js_1.default;
exports.logger = logger_js_1.default;
Object.defineProperty(exports, "DeathBattleLogger", { enumerable: true, get: function () { return logger_js_1.DeathBattleLogger; } });
// Default export
exports.default = {
    embedBuilder: embedBuilder_js_1.default,
    logger: logger_js_1.default
};
//# sourceMappingURL=index.js.map