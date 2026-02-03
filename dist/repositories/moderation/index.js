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
const InfractionRepository_1 = __importDefault(require("./InfractionRepository"));
exports.InfractionRepository = InfractionRepository_1.default;
const AutoModRepository_1 = __importDefault(require("./AutoModRepository"));
exports.AutoModRepository = AutoModRepository_1.default;
const FilterRepository_1 = __importDefault(require("./FilterRepository"));
exports.FilterRepository = FilterRepository_1.default;
const ModLogRepository_1 = __importDefault(require("./ModLogRepository"));
exports.ModLogRepository = ModLogRepository_1.default;
// Default export
exports.default = {
    InfractionRepository: InfractionRepository_1.default,
    AutoModRepository: AutoModRepository_1.default,
    FilterRepository: FilterRepository_1.default,
    ModLogRepository: ModLogRepository_1.default
};
//# sourceMappingURL=index.js.map