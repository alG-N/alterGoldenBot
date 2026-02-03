"use strict";
/**
 * Death Battle Services Index
 * @module services/fun/deathbattle
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.skillsetService = exports.SkillsetService = exports.battleService = exports.BattleService = void 0;
var BattleService_js_1 = require("./BattleService.js");
Object.defineProperty(exports, "BattleService", { enumerable: true, get: function () { return BattleService_js_1.BattleService; } });
Object.defineProperty(exports, "battleService", { enumerable: true, get: function () { return __importDefault(BattleService_js_1).default; } });
var SkillsetService_js_1 = require("./SkillsetService.js");
Object.defineProperty(exports, "SkillsetService", { enumerable: true, get: function () { return SkillsetService_js_1.SkillsetService; } });
Object.defineProperty(exports, "skillsetService", { enumerable: true, get: function () { return __importDefault(SkillsetService_js_1).default; } });
//# sourceMappingURL=index.js.map