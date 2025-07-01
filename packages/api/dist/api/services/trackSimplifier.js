"use strict";
// services/trackSimplifier.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.simplifyRDP = simplifyRDP;
exports.filterNoise = filterNoise;
exports.cleanTrack = cleanTrack;
// --- RDP (адаптировано под TS) ---
function getPerpendicularDistance(p, p1, p2) {
    const [lat, lon] = p;
    const [lat1, lon1] = p1;
    const [lat2, lon2] = p2;
    return Math.abs((lon2 - lon1) * (lat1 - lat) - (lat1 - lat2) * (lon1 - lon)) / Math.hypot(lon2 - lon1, lat2 - lat1);
}
/** Ramer–Douglas–Peucker */
function simplifyRDP(points, ε) {
    console.debug(`[simplifyRDP] start ε=${ε}, inputPoints=${points.length}`);
    if (points.length < 3) {
        console.debug(`[simplifyRDP] too few points, returning as is`);
        return points;
    }
    let dmax = 0, index = 0;
    for (let i = 1; i < points.length - 1; i++) {
        const d = getPerpendicularDistance(points[i], points[0], points[points.length - 1]);
        if (d > dmax) {
            index = i;
            dmax = d;
        }
    }
    if (dmax > ε) {
        const rec1 = simplifyRDP(points.slice(0, index + 1), ε);
        const rec2 = simplifyRDP(points.slice(index), ε);
        const result = rec1.slice(0, -1).concat(rec2);
        console.debug(`[simplifyRDP] ε=${ε} → split at index=${index}, resultPoints=${result.length}`);
        return result;
    }
    const result = [points[0], points[points.length - 1]];
    console.debug(`[simplifyRDP] ε=${ε} → simplified to 2 points`);
    return result;
}
/** Вычисляет расстояние между двумя точками (широта/долгота) по формуле Haversine */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = Math.PI / 180;
    const dLat = (lat2 - lat1) * toRad;
    const dLon = (lon2 - lon1) * toRad;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const R = 6371000; // радиус Земли в метрах
    return R * c;
}
/** Удаляет «шумные» точки с резкими скачками (> maxDeltaMeters) */
function filterNoise(points, maxDeltaMeters) {
    if (points.length === 0)
        return [];
    const result = [points[0]];
    for (let i = 1; i < points.length; i++) {
        const prev = result[result.length - 1];
        const curr = points[i];
        const [lon1, lat1] = prev.loc.coordinates;
        const [lon2, lat2] = curr.loc.coordinates;
        const dist = haversineDistance(lat1, lon1, lat2, lon2);
        if (dist <= maxDeltaMeters) {
            result.push(curr);
        }
    }
    return result;
}
/** Фильтрация шума + упрощение линии через RDP */
function cleanTrack(points, maxDeltaMeters = 50, epsilon = 10) {
    const filtered = filterNoise(points, maxDeltaMeters);
    const coords = filtered.map((p) => {
        const [lon, lat] = p.loc.coordinates;
        return [lat, lon];
    });
    return simplifyRDP(coords, epsilon);
}
