/* 3D force simulation for the Map Room — the 2D sim from v1 given a z axis.
 * Pure data, no three.js: the scene reads node positions each frame.
 * Seeded (mulberry32) so every visitor sees the same landscape.
 */

export function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
}

export function buildWorld(graph) {
    const nodes = graph.nodes.map((n) => ({ ...n }));
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const edges = graph.edges
        .filter((e) => byId.has(e.from) && byId.has(e.to))
        .map((e) => ({ ...e, a: byId.get(e.from), b: byId.get(e.to) }));

    const neighbours = new Map(nodes.map((n) => [n.id, new Set()]));
    const degree = new Map(nodes.map((n) => [n.id, 0]));
    for (const e of edges) {
        neighbours.get(e.from).add(e.to);
        neighbours.get(e.to).add(e.from);
        degree.set(e.from, degree.get(e.from) + 1);
        degree.set(e.to, degree.get(e.to) + 1);
    }
    const parentCount = new Map();
    for (const e of edges) {
        if (e.kind === 'parent') parentCount.set(e.from, (parentCount.get(e.from) || 0) + 1);
    }

    // Topics start on a fibonacci sphere so the course opens as a globe of
    // clusters; concepts hatch in a small cloud around their home topic.
    const topics = nodes.filter((n) => n.kind === 'topic');
    const golden = Math.PI * (3 - Math.sqrt(5));
    topics.forEach((t, i) => {
        const y = 1 - (i / Math.max(1, topics.length - 1)) * 2;
        const rad = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = golden * i;
        t.x = Math.cos(theta) * rad * 620;
        t.y = y * 620;
        t.z = Math.sin(theta) * rad * 620;
    });
    for (const n of nodes) {
        if (n.kind === 'topic') continue;
        const rand = mulberry32(hashStr(n.id));
        const home = topics.find((t) => t.parent === n.parent) || { x: 0, y: 0, z: 0 };
        n.x = home.x + (rand() - 0.5) * 180;
        n.y = home.y + (rand() - 0.5) * 180;
        n.z = home.z + (rand() - 0.5) * 180;
    }
    for (const n of nodes) {
        n.vx = 0; n.vy = 0; n.vz = 0; n.fixed = false;
        n.hub = n.kind !== 'topic' && (parentCount.get(n.id) || 0) > 1;
        n.r = n.kind === 'topic'
            ? Math.min(26, 15 + (degree.get(n.id) || 0) * 0.3)
            : n.hub ? 7.5 : 4.5;
    }

    return { nodes, edges, byId, neighbours, degree, alpha: 1.2 };
}

export function tick(w) {
    const { nodes, edges } = w;
    const alpha = Math.max(w.alpha, 0);
    if (alpha <= 0.015) return false;

    for (const e of edges) {
        const rest = e.kind === 'parent'
            ? (e.a.kind === 'topic' || e.b.kind === 'topic' ? 130 : 95)
            : 480;
        const k = e.kind === 'parent' ? 0.05 : 0.012;
        const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y, dz = e.b.z - e.a.z;
        const d = Math.max(1, Math.sqrt(dx * dx + dy * dy + dz * dz));
        const f = k * (d - rest) * alpha;
        const fx = (dx / d) * f, fy = (dy / d) * f, fz = (dz / d) * f;
        if (!e.a.fixed) { e.a.vx += fx; e.a.vy += fy; e.a.vz += fz; }
        if (!e.b.fixed) { e.b.vx -= fx; e.b.vy -= fy; e.b.vz -= fz; }
    }

    const cutoff = 260, cutoff2 = cutoff * cutoff;
    for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
            const b = nodes[j];
            const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
            const d2 = dx * dx + dy * dy + dz * dz;
            if (d2 > cutoff2 || d2 === 0) continue;
            const d = Math.sqrt(d2);
            const mass = (a.kind === 'topic' ? 2.6 : 1) * (b.kind === 'topic' ? 2.6 : 1);
            const f = (1150 * mass * alpha) / d2;
            const fx = (dx / d) * f, fy = (dy / d) * f, fz = (dz / d) * f;
            if (!a.fixed) { a.vx -= fx; a.vy -= fy; a.vz -= fz; }
            if (!b.fixed) { b.vx += fx; b.vy += fy; b.vz += fz; }
        }
    }

    for (const n of nodes) {
        if (n.fixed) { n.vx = 0; n.vy = 0; n.vz = 0; continue; }
        n.vx -= n.x * 0.003 * alpha;
        n.vy -= n.y * 0.003 * alpha;
        n.vz -= n.z * 0.003 * alpha;
        n.vx *= 0.82; n.vy *= 0.82; n.vz *= 0.82;
        n.x += n.vx; n.y += n.vy; n.z += n.vz;
    }
    w.alpha *= 0.988;
    return true;
}

export function reheat(w, amount = 0.35) {
    w.alpha = Math.max(w.alpha, amount);
}
