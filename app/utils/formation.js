/*
 * Turn a formation string like "4-3-3" or "4-2-3-1" plus an ordered
 * list of 11 players into positioned markers (x/y % of pitch).
 *
 * Pitch orientation: portrait, attack = top, own goal = bottom.
 * Rows, bottom → top:
 *   GK        → y 88%
 *   back line → y 68%
 *   mid lines → spaced between 45% and 25%
 *   front     → y 14%
 *
 * Each row spreads its N players evenly across x: i+1 / N+1.
 *
 * If a player has an explicit `grid` (api-football style "row:col"
 * with row=1 nearest own goal), we respect that instead of order.
 */

export function parseFormation(str) {
    const parts = String(str || '4-3-3').split('-').map(n => parseInt(n, 10)).filter(n => n > 0);
    if (!parts.length) return [4, 3, 3];
    return parts;
}

export function positions(formationStr, players) {
    const rows = parseFormation(formationStr);      // e.g. [4, 3, 3]
    const totalRows = rows.length + 1;              // +1 for GK
    // Row y-positions from bottom (GK) to top (most attacking line).
    // Compress spacing when there are more than 4 total rows so markers
    // don't touch edges.
    const yTop = 14;
    const yBottom = 88;
    const yGap = (yBottom - yTop) / (totalRows - 1);
    const rowY = [];
    for (let i = 0; i < totalRows; i++) rowY.push(yBottom - i * yGap);

    const out = [];
    const list = players || [];
    let idx = 0;

    // GK — always render a marker even without a player object
    const gk = list[0] || {};
    out.push(Object.assign({}, gk, { x: 50, y: rowY[0] }));
    idx = 1;

    for (let r = 0; r < rows.length; r++) {
        const n = rows[r];
        for (let c = 0; c < n; c++) {
            const p = list[idx] || {};
            const x = ((c + 1) / (n + 1)) * 100;
            out.push(Object.assign({}, p, { x, y: rowY[r + 1] }));
            idx++;
        }
    }
    return out;
}
