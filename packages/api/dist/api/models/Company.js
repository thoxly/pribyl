"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const companySchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    inn: { type: String },
    kpp: { type: String },
    ogrn: { type: String },
    users: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }],
}, { timestamps: true });
exports.default = mongoose_1.models.Company || (0, mongoose_1.model)('Company', companySchema);
