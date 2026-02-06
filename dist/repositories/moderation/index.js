"use strict";
/**
 * Moderation Repository Index
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModLogRepository = exports.FilterRepository = exports.AutoModRepository = exports.InfractionRepository = void 0;
// Import repositories
const InfractionRepository_js_1 = __importDefault(require("./InfractionRepository.js"));
exports.InfractionRepository = InfractionRepository_js_1.default;
const AutoModRepository_js_1 = __importDefault(require("./AutoModRepository.js"));
exports.AutoModRepository = AutoModRepository_js_1.default;
const FilterRepository_js_1 = __importDefault(require("./FilterRepository.js"));
exports.FilterRepository = FilterRepository_js_1.default;
const ModLogRepository_js_1 = __importDefault(require("./ModLogRepository.js"));
exports.ModLogRepository = ModLogRepository_js_1.default;
// Default export
exports.default = {
    InfractionRepository: InfractionRepository_js_1.default,
    AutoModRepository: AutoModRepository_js_1.default,
    FilterRepository: FilterRepository_js_1.default,
    ModLogRepository: ModLogRepository_js_1.default
};
//# sourceMappingURL=index.js.map