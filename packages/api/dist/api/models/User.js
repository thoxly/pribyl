"use strict";
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
const mongoose_1 = __importStar(require("mongoose"));
const userSchema = new mongoose_1.Schema({
    telegramId: { type: Number, unique: true, sparse: true },
    fullName: { type: String },
    username: { type: String },
    photoUrl: { type: String },
    role: { type: String, default: 'worker' },
    company: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Company',
        default: null,
    },
    onboardingCompleted: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ['active', 'pending'],
        default: 'pending',
    },
    inviteCode: { type: String, unique: true },
    manager: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User', // Ссылка на модель User (руководитель - это другой пользователь)
        default: null, // Поле может быть пустым
    },
}, { timestamps: true });
exports.default = mongoose_1.default.models.User || (0, mongoose_1.model)('User', userSchema);
