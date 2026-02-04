"use strict";
/**
 * Skillsets Index
 * Re-exports all skillsets for Death Battle
 * @module config/deathbattle/skillsets
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.skillsetsMap = exports.skillsets = exports.crossover = exports.demonslayer = exports.jjk = exports.onepiece = exports.naruto = void 0;
const naruto_js_1 = __importDefault(require("./naruto.js"));
exports.naruto = naruto_js_1.default;
const onepiece_js_1 = __importDefault(require("./onepiece.js"));
exports.onepiece = onepiece_js_1.default;
const jjk_js_1 = __importDefault(require("./jjk.js"));
exports.jjk = jjk_js_1.default;
const demonslayer_js_1 = __importDefault(require("./demonslayer.js"));
exports.demonslayer = demonslayer_js_1.default;
const crossover_js_1 = __importDefault(require("./crossover.js"));
exports.crossover = crossover_js_1.default;
// All skillsets as array
exports.skillsets = [naruto_js_1.default, onepiece_js_1.default, jjk_js_1.default, demonslayer_js_1.default, crossover_js_1.default];
// Skillsets map by name
exports.skillsetsMap = {
    naruto: naruto_js_1.default,
    onepiece: onepiece_js_1.default,
    jjk: jjk_js_1.default,
    demonslayer: demonslayer_js_1.default,
    crossover: crossover_js_1.default
};
exports.default = exports.skillsets;
//# sourceMappingURL=index.js.map