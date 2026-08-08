/* Label and glow sprites for the Map Room.
 *
 * Text is drawn to small canvases and mounted as sprite textures. Every
 * texture made here is registered on the returned handle so the scene can
 * dispose the lot on unmount (CanvasTextures leak GPU memory otherwise).
 */

/* next/font may register hashed family names — resolve the real families
 * from the CSS variables at runtime rather than hardcoding 'Fraunces'. */
export function resolveFontStack(cssVar, fallback) {
    const probe = document.createElement('span');
    probe.style.fontFamily = `var(${cssVar})`;
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    document.body.appendChild(probe);
    const fam = getComputedStyle(probe).fontFamily;
    probe.remove();
    return fam && fam !== 'initial' ? fam : fallback;
}

const TEX_DPR = 2;

export function makeLabelSprite(THREE, text, {
    fontStack,
    weight = 400,
    px = 26,
    colour = '#F2EBE0',
    halo = 'rgba(10, 17, 13, 0.92)',
    worldHeight = 26,
} = {}) {
    const font = `${weight} ${px * TEX_DPR}px ${fontStack}`;
    const probe = document.createElement('canvas').getContext('2d');
    probe.font = font;
    const w = Math.ceil(probe.measureText(text).width) + 14 * TEX_DPR;
    const h = Math.ceil(px * TEX_DPR * 1.5);

    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = halo;
    ctx.lineWidth = 5 * TEX_DPR;
    ctx.strokeText(text, w / 2, h / 2);
    ctx.fillStyle = colour;
    ctx.fillText(text, w / 2, h / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const material = new THREE.SpriteMaterial({
        // Starts invisible: the scene fades every label toward its computed
        // target opacity each frame (scene.js #frame). Without this, THREE's
        // default opacity of 1 means every one of the ~300 concept labels
        // is fully visible for the first rendered frame — a bright, cluttered
        // flash of the whole room's names before the fade-out catches up.
        map: texture, transparent: true, depthWrite: false, opacity: 0,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set((worldHeight * w) / h, worldHeight, 1);
    return { sprite, texture, material };
}

/* Soft radial glow, one shared texture tinted per sprite. */
export function makeGlowTexture(THREE) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.28)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

export function makeGlowSprite(THREE, glowTexture, colourHex, worldSize, opacity) {
    const material = new THREE.SpriteMaterial({
        map: glowTexture,
        color: new THREE.Color(colourHex),
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(worldSize, worldSize, 1);
    return { sprite, material };
}
