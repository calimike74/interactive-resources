/* The Map Room, in the round — three.js scene for the Component 4 graph.
 *
 * One InstancedMesh carries every node; lines carry every edge; labels and
 * glows are sprites. The 3D force sim (sim3d.js) owns positions, the scene
 * reads them each frame, so grabbing any node drags its neighbourhood with
 * it. The camera is an orbit: students turn the whole course in their hands.
 *
 * Navigation is deliberate: hover only lights a neighbourhood, click only
 * raises the index card — the card's link is the sole way out of the room.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildWorld, tick, reheat, setLayout } from './sim3d';
import { STUDIO_ANCHORS } from './layouts';
import { ROOM, topicInk, conceptInk } from './palette';
import { resolveFontStack, makeLabelSprite, makeGlowTexture, makeGlowSprite } from './labels';

const EASE_HOUSE = [0.22, 1, 0.36, 1];
function cubicBezier([x1, y1, x2, y2]) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sampleX = (t) => ((ax * t + bx) * t + cx) * t;
    const sampleY = (t) => ((ay * t + by) * t + cy) * t;
    const sampleDX = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
        let t = x;
        for (let i = 0; i < 5; i++) {
            const err = sampleX(t) - x;
            const d = sampleDX(t);
            if (Math.abs(err) < 1e-4 || Math.abs(d) < 1e-6) break;
            t -= err / d;
        }
        return sampleY(Math.min(1, Math.max(0, t)));
    };
}
const easeHouse = cubicBezier(EASE_HOUSE);

const FLY_MS = 1100;
const DIM = 0.12;            // how far a dimmed node keeps its own colour
const FOG_C = new THREE.Color(ROOM.fog);

export class MapRoomScene {
    constructor(container, graph, { reduced, onSelect, onUserGesture, onHover } = {}) {
        this.container = container;
        this.reduced = !!reduced;
        this.onSelect = onSelect || (() => {});
        this.onUserGesture = onUserGesture || (() => {});
        this.onHover = onHover || (() => {});
        this.disposed = false;
        this.layoutMode = 'concept';
        this.hiddenLabelIds = null;   // Set<nodeId> whose names the quiz withholds

        this.world = buildWorld(graph);
        const settle = this.reduced ? 600 : 170;
        for (let i = 0; i < settle; i++) tick(this.world);
        if (this.reduced) this.world.alpha = 0;

        try {
            this.renderer = new THREE.WebGLRenderer({
                antialias: true, alpha: true, preserveDrawingBuffer: true,
            });
        } catch {
            this.failed = true;
            return;
        }
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        this.renderer.setPixelRatio(dpr);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.12;
        container.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(FOG_C, 0.00025);

        // Studio-soft gloss on every sphere (the Marble water-lab look):
        // an environment map gives the broad highlight no point light can.
        const pmrem = new THREE.PMREMGenerator(this.renderer);
        this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        this.scene.environmentIntensity = 0.7;
        pmrem.dispose();

        this.camera = new THREE.PerspectiveCamera(45, 1, 10, 9000);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.minDistance = 170;
        this.controls.maxDistance = 3400;
        this.controls.autoRotateSpeed = 0.35;

        // The room's light: the environment does the gloss; these two only
        // tint it — warm lamp from below, cool night rim from above.
        this.scene.add(new THREE.HemisphereLight('#2C3A31', '#77603A', 0.5));
        const lamp = new THREE.DirectionalLight('#F2E2B8', 0.45);
        lamp.position.set(120, -900, 300);
        this.scene.add(lamp);
        const rim = new THREE.DirectionalLight('#9CC2CE', 0.2);
        rim.position.set(-300, 900, -400);
        this.scene.add(rim);

        this.#buildNodes();
        this.#buildEdges();
        this.#buildSprites();
        this.#buildMotes();

        this.hoverId = null;
        this.selectedId = null;
        this.focusSet = null;
        this.tween = null;
        this.lastGestureAt = -1e9;
        this.pointer = new THREE.Vector2();
        this.pointerMoved = false;
        this.drag = null;
        this.raycaster = new THREE.Raycaster();

        this.#bindEvents();

        this.resize();
        this.ro = new ResizeObserver(() => this.resize());
        this.ro.observe(container);

        // Arrive: settle the framing, then breathe in (cut, if reduced).
        const fit = this.#fitFor(null, 1.06);
        const dir = new THREE.Vector3(0.42, 0.3, 1).normalize();
        this.controls.target.set(0, 0, 0);
        if (this.reduced) {
            this.camera.position.copy(dir.multiplyScalar(fit.dist));
        } else {
            this.camera.position.copy(dir.clone().multiplyScalar(fit.dist * 1.3));
            this.flyTo(new THREE.Vector3(0, 0, 0), fit.dist);
        }
        this.camera.lookAt(0, 0, 0);

        this.raf = requestAnimationFrame((t) => this.#frame(t));
    }

    /* ---------- construction ---------- */

    #buildNodes() {
        const { nodes } = this.world;
        const geo = new THREE.SphereGeometry(1, 24, 16);
        const mat = new THREE.MeshStandardMaterial({
            roughness: 0.3, metalness: 0.05, envMapIntensity: 0.85,
        });
        const mesh = new THREE.InstancedMesh(geo, mat, nodes.length);
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

        this.baseColour = [];
        this.liveColour = [];
        this.scaleNow = new Float32Array(nodes.length).fill(1);
        const m = new THREE.Matrix4();
        nodes.forEach((n, i) => {
            const hex = n.kind === 'topic' ? topicInk(n.parent)
                : n.hub ? ROOM.brass : conceptInk(n.parent);
            const c = new THREE.Color(hex);
            this.baseColour.push(c);
            this.liveColour.push(c.clone());
            mesh.setColorAt(i, c);
            m.makeScale(n.r, n.r, n.r).setPosition(n.x, n.y, n.z);
            mesh.setMatrixAt(i, m);
        });
        mesh.instanceColor.needsUpdate = true;
        this.nodesMesh = mesh;
        this.scene.add(mesh);
    }

    #buildEdges() {
        const { edges } = this.world;
        const pos = new Float32Array(edges.length * 6);
        const col = new Float32Array(edges.length * 6);
        this.edgeBase = [];
        edges.forEach((e) => {
            let hex;
            if (e.kind === 'signal-path') hex = ROOM.sienna;
            else if (e.kind === 'exam-link') hex = ROOM.mustard;
            else if (e.kind === 'related') hex = '#5F7058';
            else hex = conceptInk(e.a.kind === 'topic' ? e.a.parent : e.b.parent);
            const strength = e.kind === 'signal-path' ? 0.9
                : e.kind === 'exam-link' ? 0.8
                    : e.kind === 'related' ? 0.5 : 0.34;
            this.edgeBase.push(new THREE.Color(hex).lerp(FOG_C, 1 - strength));
        });
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
        const mat = new THREE.LineBasicMaterial({
            vertexColors: true, transparent: true, opacity: 0.8,
        });
        this.linesMesh = new THREE.LineSegments(geo, mat);
        this.scene.add(this.linesMesh);
    }

    #buildSprites() {
        const fraunces = resolveFontStack('--font-fraunces', 'Georgia, serif');
        const geist = resolveFontStack('--font-geist-sans', 'sans-serif');
        this.textures = [];
        this.labels = [];       // aligned with world.nodes
        this.glows = [];        // {i, sprite, material, base}
        const glowTex = makeGlowTexture(THREE);
        this.textures.push(glowTex);

        this.world.nodes.forEach((n, i) => {
            const isTopic = n.kind === 'topic';
            const { sprite, texture, material } = makeLabelSprite(THREE, n.label, {
                fontStack: isTopic ? fraunces : geist,
                weight: isTopic ? 600 : 400,
                px: isTopic ? 30 : 24,
                colour: isTopic ? ROOM.ink : n.hub ? ROOM.brass : '#CDD3C2',
                worldHeight: 1,     // real scale is set per-frame from camera distance
            });
            material.depthTest = false;
            material.fog = false;
            sprite.renderOrder = isTopic ? 20 : 15;
            sprite.center.set(0.5, 1.35);
            sprite.userData.aspect = sprite.scale.x / sprite.scale.y;
            sprite.visible = isTopic;
            this.labels.push({ sprite, material, isTopic, hub: n.hub, i });
            this.textures.push(texture);
            this.scene.add(sprite);

            if (isTopic || n.hub) {
                const glow = makeGlowSprite(
                    THREE, glowTex,
                    isTopic ? topicInk(n.parent) : ROOM.brass,
                    n.r * (isTopic ? 7.5 : 6),
                    isTopic ? 0.34 : 0.42
                );
                glow.sprite.renderOrder = 2;
                glow.base = glow.material.opacity;
                glow.i = i;
                this.glows.push(glow);
                this.scene.add(glow.sprite);
            }
        });
    }

    #buildMotes() {
        const count = 420;
        const rand = (() => { let s = 41; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = 380 + rand() * 1100;
            const t = rand() * Math.PI * 2;
            const p = Math.acos(2 * rand() - 1);
            pos[i * 3] = r * Math.sin(p) * Math.cos(t);
            pos[i * 3 + 1] = r * Math.cos(p);
            pos[i * 3 + 2] = r * Math.sin(p) * Math.sin(t);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({
            color: new THREE.Color(ROOM.brass), size: 4, sizeAttenuation: true,
            transparent: true, opacity: 0.22,
            blending: THREE.AdditiveBlending, depthWrite: false,
        });
        this.motes = new THREE.Points(geo, mat);
        this.scene.add(this.motes);
    }

    /* ---------- camera ---------- */

    #fitFor(idSet, pad = 1.14) {
        const set = idSet && idSet.size
            ? [...idSet].map((id) => this.world.byId.get(id)).filter(Boolean)
            : this.world.nodes;
        const centre = new THREE.Vector3();
        for (const n of set) centre.add(new THREE.Vector3(n.x, n.y, n.z));
        centre.divideScalar(Math.max(1, set.length));
        let radius = 60;
        for (const n of set) {
            radius = Math.max(radius, centre.distanceTo(new THREE.Vector3(n.x, n.y, n.z)) + n.r * 3);
        }
        const vFov = (this.camera.fov * Math.PI) / 180;
        const hFov = 2 * Math.atan(Math.tan(vFov / 2) * this.camera.aspect);
        const dist = Math.min(3300, Math.max(220,
            (radius * pad) / Math.sin(Math.min(vFov, hFov) / 2)));
        return { centre, dist };
    }

    flyToFit(idSet, pad) {
        const { centre, dist } = this.#fitFor(idSet, pad);
        this.flyTo(centre, dist);
    }

    flyTo(targetCentre, dist) {
        const dir = this.camera.position.clone().sub(this.controls.target).normalize();
        const toPos = targetCentre.clone().add(dir.multiplyScalar(dist));
        if (this.reduced) {
            this.controls.target.copy(targetCentre);
            this.camera.position.copy(toPos);
            return;
        }
        this.tween = {
            fromPos: this.camera.position.clone(),
            fromTarget: this.controls.target.clone(),
            toPos, toTarget: targetCentre.clone(),
            start: performance.now(),
        };
    }

    /* Ease the camera's attention to one node without changing distance. */
    lookAtNode(id) {
        const n = this.world.byId.get(id);
        if (!n) return;
        const dist = this.camera.position.distanceTo(this.controls.target);
        this.flyTo(new THREE.Vector3(n.x, n.y, n.z), Math.min(dist, 760));
    }

    setFocus(idSet) {
        this.focusSet = idSet || null;
    }

    clearSelection() {
        this.selectedId = null;
    }

    setHiddenLabels(idSet) {
        this.hiddenLabelIds = idSet && idSet.size ? idSet : null;
    }

    /* Re-hang the room: 'concept' (force layout) or 'studio' (signal chain). */
    setLayout(mode) {
        if (mode === this.layoutMode) return;
        this.layoutMode = mode;
        const anchors = mode === 'studio'
            ? new Map(this.world.nodes
                .filter((n) => n.kind === 'topic' && STUDIO_ANCHORS[n.parent])
                .map((n) => [n.id, STUDIO_ANCHORS[n.parent]]))
            : null;
        setLayout(this.world, mode, anchors);
        if (this.reduced) {
            // no live sim under reduced motion — settle the new layout at once
            for (let i = 0; i < 500; i++) tick(this.world);
            this.world.alpha = 0;
        }
        setTimeout(() => { if (!this.disposed) this.flyToFit(null, 1.06); },
            this.reduced ? 0 : 650);
    }

    /* ---------- events ---------- */

    #bindEvents() {
        const el = this.renderer.domElement;
        el.style.touchAction = 'none';
        this.onDown = (e) => {
            this.lastGestureAt = performance.now();
            this.tween = null;
            this.onUserGesture();
            this.#setPointer(e);
            const hit = this.#pick();
            this.downAt = { x: e.clientX, y: e.clientY, hit };
            if (hit != null && e.isPrimary) {
                const n = this.world.nodes[hit];
                n.fixed = true;
                this.controls.enabled = false;
                const planeNormal = this.camera.getWorldDirection(new THREE.Vector3());
                this.drag = {
                    index: hit,
                    plane: new THREE.Plane().setFromNormalAndCoplanarPoint(
                        planeNormal, new THREE.Vector3(n.x, n.y, n.z)),
                };
                el.setPointerCapture(e.pointerId);
            }
        };
        this.onMove = (e) => {
            this.#setPointer(e);
            this.pointerMoved = true;
            if (this.drag) {
                const n = this.world.nodes[this.drag.index];
                this.raycaster.setFromCamera(this.pointer, this.camera);
                const p = new THREE.Vector3();
                if (this.raycaster.ray.intersectPlane(this.drag.plane, p)) {
                    n.x = p.x; n.y = p.y; n.z = p.z;
                    if (!this.reduced) reheat(this.world);
                }
            }
        };
        this.onUp = (e) => {
            if (this.drag) {
                this.world.nodes[this.drag.index].fixed = false;
                this.drag = null;
                this.controls.enabled = true;
            }
            if (this.downAt) {
                const moved = Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y);
                if (moved < 6) {
                    if (this.downAt.hit != null) {
                        const n = this.world.nodes[this.downAt.hit];
                        this.selectedId = n.id;
                        this.onSelect(n);
                        this.lookAtNode(n.id);
                    } else {
                        this.selectedId = null;
                        this.onSelect(null);
                    }
                }
                this.downAt = null;
            }
        };
        this.onWheelGesture = () => {
            this.lastGestureAt = performance.now();
            this.tween = null;
            this.onUserGesture();
        };
        el.addEventListener('pointerdown', this.onDown);
        el.addEventListener('pointermove', this.onMove);
        el.addEventListener('pointerup', this.onUp);
        el.addEventListener('pointercancel', this.onUp);
        el.addEventListener('wheel', this.onWheelGesture, { passive: true });
    }

    #setPointer(e) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.pointer.set(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
    }

    #pick() {
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const hits = this.raycaster.intersectObject(this.nodesMesh);
        return hits.length ? hits[0].instanceId : null;
    }

    /* ---------- per-frame ---------- */

    #emphasisSet() {
        if (this.focusSet) return this.focusSet;
        const seed = this.selectedId ?? this.hoverId;
        if (seed == null) return null;
        const set = new Set([seed]);
        for (const nb of this.world.neighbours.get(seed) || []) set.add(nb);
        return set;
    }

    #frame(now) {
        if (this.disposed) return;
        this.raf = requestAnimationFrame((t) => this.#frame(t));
        const w = this.world;

        if (!this.reduced) tick(w);

        // hover pick (only when the pointer actually moved)
        if (this.pointerMoved && !this.drag) {
            this.pointerMoved = false;
            const hit = this.#pick();
            const id = hit != null ? w.nodes[hit].id : null;
            if (id !== this.hoverId) {
                this.hoverId = id;
                this.renderer.domElement.style.cursor = id ? 'pointer' : 'grab';
                this.onHover(id != null ? this.world.byId.get(id) : null);
            }
        }

        // camera tween
        if (this.tween) {
            const t = Math.min(1, (now - this.tween.start) / FLY_MS);
            const e = easeHouse(t);
            this.camera.position.lerpVectors(this.tween.fromPos, this.tween.toPos, e);
            this.controls.target.lerpVectors(this.tween.fromTarget, this.tween.toTarget, e);
            if (t >= 1) this.tween = null;
        }

        this.controls.autoRotate = !this.reduced && !this.focusSet && !this.selectedId
            && this.layoutMode === 'concept' && now - this.lastGestureAt > 4000;
        this.controls.update();

        const emph = this.#emphasisSet();
        const camPos = this.camera.position;
        const vFov = (this.camera.fov * Math.PI) / 180;
        const viewH = this.renderer.domElement.clientHeight || 700;
        const m = new THREE.Matrix4();
        const tmp = new THREE.Color();

        w.nodes.forEach((n, i) => {
            const inSet = !emph || emph.has(n.id);
            const isSeed = n.id === this.hoverId || n.id === this.selectedId;
            const targetScale = isSeed ? 1.32 : 1;
            this.scaleNow[i] += (targetScale - this.scaleNow[i]) * 0.16;
            const s = n.r * this.scaleNow[i];
            m.makeScale(s, s, s).setPosition(n.x, n.y, n.z);
            this.nodesMesh.setMatrixAt(i, m);

            tmp.copy(this.baseColour[i]);
            if (!inSet) tmp.lerp(FOG_C, 1 - DIM);
            this.liveColour[i].lerp(tmp, 0.14);
            this.nodesMesh.setColorAt(i, this.liveColour[i]);
        });
        this.nodesMesh.instanceMatrix.needsUpdate = true;
        this.nodesMesh.instanceColor.needsUpdate = true;

        // edges follow their nodes; dim with the same emphasis
        const pos = this.linesMesh.geometry.attributes.position.array;
        const col = this.linesMesh.geometry.attributes.color.array;
        w.edges.forEach((e, i) => {
            pos[i * 6] = e.a.x; pos[i * 6 + 1] = e.a.y; pos[i * 6 + 2] = e.a.z;
            pos[i * 6 + 3] = e.b.x; pos[i * 6 + 4] = e.b.y; pos[i * 6 + 5] = e.b.z;
            tmp.copy(this.edgeBase[i]);
            const inSet = !emph || (emph.has(e.from) && emph.has(e.to));
            if (!inSet) tmp.lerp(FOG_C, 0.94);
            col[i * 6] = tmp.r; col[i * 6 + 1] = tmp.g; col[i * 6 + 2] = tmp.b;
            col[i * 6 + 3] = tmp.r; col[i * 6 + 4] = tmp.g; col[i * 6 + 5] = tmp.b;
        });
        this.linesMesh.geometry.attributes.position.needsUpdate = true;
        this.linesMesh.geometry.attributes.color.needsUpdate = true;

        // labels: constant screen size, semantic zoom on concepts
        const viewW = this.renderer.domElement.clientWidth || 1280;
        const pv = this._pv || (this._pv = new THREE.Vector3());
        for (const L of this.labels) {
            const n = w.nodes[L.i];
            const d = camPos.distanceTo(L.sprite.position.set(n.x, n.y, n.z));
            const inSet = !emph || emph.has(n.id);
            const isSeed = n.id === this.hoverId || n.id === this.selectedId;
            L.isSeed = isSeed; L.d = d;
            if (this.hiddenLabelIds?.has(n.id)) { L.targetO = 0; continue; }
            if (L.isTopic) {
                L.targetO = inSet ? 1 : 0.14;
            } else {
                const near = Math.min(1, Math.max(0, (620 - d) / 300));
                if (isSeed) L.targetO = 1;                       // the node in hand
                else if (emph && inSet) L.targetO = Math.max(near, 0.85);  // lit neighbourhood or tour beat
                else if (emph) L.targetO = 0;                    // outside the lit set
                else L.targetO = near;                           // free exploration: semantic zoom
            }
        }

        // declutter: project would-be-visible labels, let the bigger node's
        // name win any screen-space clash (a hovered/selected name always wins)
        const proj = [];
        for (const L of this.labels) {
            if (L.targetO < 0.1) continue;
            const n = w.nodes[L.i];
            pv.set(n.x, n.y, n.z).project(this.camera);
            if (pv.z > 1) { L.targetO = 0; continue; }   // behind the camera
            const basePx = L.isTopic ? 15.5 : 12;
            proj.push({
                L,
                px: (pv.x * 0.5 + 0.5) * viewW,
                py: (-pv.y * 0.5 + 0.5) * viewH,
                w: basePx * L.sprite.userData.aspect * 0.62,
                rank: (L.isSeed ? 1e6 : 0) + (L.isTopic ? 1e3 : 0) + n.r,
            });
        }
        proj.sort((a, b) => b.rank - a.rank);
        const kept = [];
        for (const p of proj) {
            const clash = kept.some((k) =>
                Math.abs(k.px - p.px) < (k.w + p.w) / 2 + 6 && Math.abs(k.py - p.py) < 21);
            if (clash && !p.L.isSeed) p.L.targetO = Math.min(p.L.targetO, 0.06);
            else kept.push(p);
        }

        for (const L of this.labels) {
            L.material.opacity += (L.targetO - L.material.opacity) * 0.18;
            L.sprite.visible = L.material.opacity > 0.03;
            if (L.sprite.visible) {
                const px = L.isTopic ? 15.5 : 12;
                const worldH = (px * 2 * Math.tan(vFov / 2) * L.d) / viewH;
                L.sprite.scale.set(worldH * L.sprite.userData.aspect, worldH, 1);
            }
        }

        // glows track their nodes and fade when dimmed
        for (const G of this.glows) {
            const n = w.nodes[G.i];
            G.sprite.position.set(n.x, n.y, n.z);
            const inSet = !emph || emph.has(n.id);
            G.material.opacity += ((inSet ? G.base : 0.04) - G.material.opacity) * 0.14;
        }

        if (!this.reduced && this.motes) this.motes.rotation.y += 0.00016;

        this.renderer.render(this.scene, this.camera);
    }

    /* ---------- lifecycle ---------- */

    resize() {
        const width = this.container.clientWidth || 1280;
        const height = this.container.clientHeight || 700;
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    dispose() {
        this.disposed = true;
        cancelAnimationFrame(this.raf);
        this.ro?.disconnect();
        const el = this.renderer?.domElement;
        if (el) {
            el.removeEventListener('pointerdown', this.onDown);
            el.removeEventListener('pointermove', this.onMove);
            el.removeEventListener('pointerup', this.onUp);
            el.removeEventListener('pointercancel', this.onUp);
            el.removeEventListener('wheel', this.onWheelGesture);
        }
        this.controls?.dispose();
        for (const t of this.textures || []) t.dispose();
        this.scene?.traverse((o) => {
            o.geometry?.dispose?.();
            if (o.material && !Array.isArray(o.material)) o.material.dispose?.();
        });
        this.renderer?.dispose();
        el?.remove();
    }
}
