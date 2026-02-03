"use strict";
/**
 * Database Module
 * Re-exports from infrastructure layer for backward compatibility
 * @module database
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialize = exports.postgres = exports.validateTable = exports.TRANSIENT_ERROR_CODES = exports.ALLOWED_TABLES = exports.isReady = exports.healthCheck = exports.close = exports.transaction = exports.deleteRows = exports.upsert = exports.update = exports.insert = exports.getMany = exports.getOne = exports.query = exports.initializeDatabase = void 0;
const adminDb = __importStar(require("./admin.js"));
const postgres_js_1 = __importDefault(require("./postgres.js"));
exports.postgres = postgres_js_1.default;
// RE-EXPORTS FROM ADMIN DB
var admin_js_1 = require("./admin.js");
Object.defineProperty(exports, "initializeDatabase", { enumerable: true, get: function () { return admin_js_1.initializeDatabase; } });
Object.defineProperty(exports, "query", { enumerable: true, get: function () { return admin_js_1.query; } });
Object.defineProperty(exports, "getOne", { enumerable: true, get: function () { return admin_js_1.getOne; } });
Object.defineProperty(exports, "getMany", { enumerable: true, get: function () { return admin_js_1.getMany; } });
Object.defineProperty(exports, "insert", { enumerable: true, get: function () { return admin_js_1.insert; } });
Object.defineProperty(exports, "update", { enumerable: true, get: function () { return admin_js_1.update; } });
Object.defineProperty(exports, "upsert", { enumerable: true, get: function () { return admin_js_1.upsert; } });
Object.defineProperty(exports, "deleteRows", { enumerable: true, get: function () { return admin_js_1.deleteRows; } });
Object.defineProperty(exports, "transaction", { enumerable: true, get: function () { return admin_js_1.transaction; } });
Object.defineProperty(exports, "close", { enumerable: true, get: function () { return admin_js_1.close; } });
Object.defineProperty(exports, "healthCheck", { enumerable: true, get: function () { return admin_js_1.healthCheck; } });
Object.defineProperty(exports, "isReady", { enumerable: true, get: function () { return admin_js_1.isReady; } });
// RE-EXPORTS FROM POSTGRES
var postgres_js_2 = require("./postgres.js");
Object.defineProperty(exports, "ALLOWED_TABLES", { enumerable: true, get: function () { return postgres_js_2.ALLOWED_TABLES; } });
Object.defineProperty(exports, "TRANSIENT_ERROR_CODES", { enumerable: true, get: function () { return postgres_js_2.TRANSIENT_ERROR_CODES; } });
Object.defineProperty(exports, "validateTable", { enumerable: true, get: function () { return postgres_js_2.validateTable; } });
// Initialize alias
exports.initialize = adminDb.initializeDatabase;
// DEFAULT EXPORT
exports.default = {
    // Main exports from admin
    ...adminDb,
    // Direct postgres access for advanced queries
    postgres: postgres_js_1.default,
    // Initialize alias
    initialize: adminDb.initializeDatabase
};
//# sourceMappingURL=index.js.map