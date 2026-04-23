/*
 * Turn a formation string like "4-3-3" or "4-2-3-1" plus an ordered
 * list of 11 players into positioned markers (x/y in 0–100 %).
 *
 * orientation 'portrait'  — attack = top,   own goal = bottom
 * orientation 'landscape' — attack = right, own goal = left
 *
 * Each row spreads its N players evenly across the cross-axis:
 * i+1 / N+1.
 */

export function parseFormation(str) {
    const parts = String(str || '4-3-3').split('-').map(n => parseInt(n, 10)).filter(n => n > 0);
    if (!parts.length) return [4, 3, 3];
    return parts;
}

export function positions(formationStr, players, orientation) {
    const rows = parseFormation(formationStr);   // e.g. [4, 3, 3]
    const totalRows = rows.length + 1;           // +1 for GK
    const landscape = orientation === 'landscape';

    // Along the "depth" axis (own-goal → attack). In portrait this
    // is the Y axis (bottom → top); in landscape, X axis (left → right).
    const depthNear = landscape ? 12 : 88;
    const depthFar  = landscape ? 88 : 14;
    const gap = (depthFar - depthNear) / (totalRows - 1);
    const depth = [];
    for (let i = 0; i < totalRows; i++) depth.push(depthNear + i * gap);

    const out = [];
    const list = players || [];
    let idx = 0;

    const place = (player, rowDepth, lane, laneCount) => {
        const cross = ((lane + 1) / (laneCount + 1)) * 100;
        const x = landscape ? rowDepth : cross;
        const y = landscape ? cross : rowDepth;
        out.push(Object.assign({}, player, { x, y }));
    };

    // GK always occupies the first depth slot, centered on cross axis.
    place(list[0] || {}, depth[0], 0, 1);
    idx = 1;

    for (let r = 0; r < rows.length; r++) {
        const n = rows[r];
        for (let c = 0; c < n; c++) {
            place(list[idx] || {}, depth[r + 1], c, n);
            idx++;
        }
    }
    return out;
}
