"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCallbackData = getCallbackData;
function getCallbackData(ctx) {
    const query = ctx.callbackQuery;
    if (query && typeof query.data === 'string') {
        return query.data;
    }
    return null;
}
