import React, {useEffect, useMemo, useRef, useState} from 'react'
import {Platform, Pressable, StyleSheet, Text, View} from 'react-native'

function safeJsonParse(value) {
  if (typeof value !== 'string') return null
  try {
    return JSON.parse(value)
  } catch (e) {
    return null
  }
}

function clampNumber(value, {min, max, fallback}) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function clampInt(value, {min, max, fallback}) {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

const DEFAULT_LEVEL = [
  '####################',
  '#..A......#......E.#',
  '#..####...#..###...#',
  '#..#..#...#....#...#',
  '#..#..#..K#..D.#.H.#',
  '#..#..#####..###...#',
  '#..#...............#',
  '#..######..#####...#',
  '#P.....E...#...#..X#',
  '####################',
]

const CELL_SIZE = 2
const WALL_HEIGHT = 2.6
const EYE_HEIGHT = 1.6
const PLAYER_RADIUS = 0.38

const WEAPONS = {
  pistol: {label: 'Pistol', cooldown: 0.22, damage: 18, pellets: 1, spread: 0.0, usesShells: false},
  shotgun: {label: 'Shotgun', cooldown: 0.9, damage: 9, pellets: 7, spread: 0.06, usesShells: true},
}

function buildConfig({moveSpeed, lookSpeed, enemyCount, difficulty}) {
  const diff = clampNumber(difficulty, {min: 0.5, max: 3, fallback: 1})
  return {
    moveSpeed: clampNumber(moveSpeed, {min: 0.8, max: 12, fallback: 4.4}),
    lookSpeed: clampNumber(lookSpeed, {min: 0.2, max: 6, fallback: 1.25}),
    enemyCount: clampInt(enemyCount, {min: 1, max: 24, fallback: 10}),
    difficulty: diff,
  }
}

function createDoomHtml({initialConfig, levelLines}) {
  const threeModuleUrls = [
    'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js',
    'https://unpkg.com/three@0.161.0/build/three.module.js',
  ]

  const initialConfigJson = JSON.stringify(initialConfig)
  const levelJson = JSON.stringify(levelLines)
  const weaponsJson = JSON.stringify(WEAPONS)

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Doom FPS</title>
    <style>
      html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #070a10; }
      #root { position: fixed; inset: 0; }
      canvas { width: 100%; height: 100%; display: block; touch-action: none; }

      .hud {
        position: fixed;
        left: 10px;
        top: 10px;
        z-index: 20;
        padding: 8px 10px;
        font: 12px/1.25 -apple-system, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        color: rgba(255,255,255,0.92);
        background: rgba(0,0,0,0.35);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 10px;
        user-select: none;
        -webkit-user-select: none;
        max-width: 78vw;
        white-space: pre-line;
      }

      .minimap {
        position: fixed;
        right: 10px;
        top: 10px;
        width: 110px;
        height: 110px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.15);
        background: rgba(0,0,0,0.25);
        z-index: 20;
        overflow: hidden;
      }
      .minimap canvas { width: 100%; height: 100%; display: block; }

      .crosshair {
        position: fixed;
        left: 50%;
        top: 50%;
        width: 16px;
        height: 16px;
        transform: translate(-50%, -50%);
        pointer-events: none;
        opacity: 0.9;
        z-index: 10;
      }
      .crosshair::before, .crosshair::after {
        content: "";
        position: absolute;
        left: 50%;
        top: 50%;
        background: rgba(255,255,255,0.85);
        transform: translate(-50%, -50%);
        border-radius: 2px;
      }
      .crosshair::before { width: 2px; height: 14px; }
      .crosshair::after { width: 14px; height: 2px; }

      .controls {
        position: fixed;
        left: 12px;
        right: 12px;
        bottom: 14px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 12px;
        z-index: 30;
        pointer-events: none;
      }
      .pad, .right { pointer-events: auto; user-select: none; -webkit-user-select: none; }
      .pad {
        display: grid;
        grid-template-columns: 54px 54px 54px;
        grid-template-rows: 54px 54px;
        gap: 10px;
      }
      .right {
        display: grid;
        grid-template-columns: 96px;
        grid-auto-rows: 54px;
        gap: 10px;
      }
      .btn {
        display: grid;
        place-items: center;
        width: 54px;
        height: 54px;
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,0.16);
        background: rgba(0,0,0,0.35);
        color: rgba(255,255,255,0.92);
        font: 800 14px/1 -apple-system, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        -webkit-tap-highlight-color: transparent;
      }
      .btn.wide { width: 96px; border-radius: 18px; }
      .btn:active { background: rgba(55, 255, 149, 0.18); border-color: rgba(55, 255, 149, 0.30); }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <div class="hud" id="hud">Loading…</div>
    <div class="minimap"><canvas id="map" width="110" height="110"></canvas></div>
    <div class="crosshair"></div>

    <div class="controls">
      <div class="pad" aria-label="Move controls">
        <div></div>
        <div class="btn" id="btnW">▲</div>
        <div></div>
        <div class="btn" id="btnA">◀</div>
        <div class="btn" id="btnS">▼</div>
        <div class="btn" id="btnD">▶</div>
      </div>
      <div class="right" aria-label="Action controls">
        <div class="btn wide" id="btnFire">FIRE</div>
        <div class="btn wide" id="btnUse">USE</div>
        <div class="btn wide" id="btnWeapon">WEAPON</div>
      </div>
    </div>

    <script>
      (function () {
        var config = ${initialConfigJson};
        window.__DOOM_CONFIG__ = config;

        function onHostMessage(event) {
          var data = event && event.data;
          if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch (e) { return; }
          }
          if (!data || typeof data !== 'object' || typeof data.type !== 'string') return;

          if (data.type === 'cmd/reset') {
            if (window.__DOOM_API__ && window.__DOOM_API__.reset) window.__DOOM_API__.reset();
          }

          if (data.type === 'cmd/togglePause') {
            if (window.__DOOM_API__ && window.__DOOM_API__.togglePause) window.__DOOM_API__.togglePause();
          }

          if (data.type === 'cmd/setConfig' && data.payload && typeof data.payload === 'object') {
            config = Object.assign({}, config, data.payload);
            window.__DOOM_CONFIG__ = config;
            if (window.__DOOM_API__ && window.__DOOM_API__.applyConfig) window.__DOOM_API__.applyConfig(config);
          }
        }

        window.addEventListener('message', onHostMessage);
        document.addEventListener('message', onHostMessage);
      })();
    </script>

    <script type="module">
      const attempted = ${JSON.stringify(threeModuleUrls)};
      let loadedFrom = null;
      let THREE = null;
      let lastError = null;
      const WEAPONS = ${weaponsJson};

      function postToHost(message) {
        try {
          const payload = JSON.stringify(message);
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(payload);
            return;
          }
          if (window.parent && window.parent !== window && window.parent.postMessage) {
            window.parent.postMessage(message, '*');
          }
        } catch (e) {}
      }

      async function loadThree() {
        for (const url of attempted) {
          try {
            loadedFrom = url;
            const mod = await import(url);
            THREE = mod;
            break;
          } catch (e) {
            lastError = e;
            loadedFrom = null;
          }
        }
        if (!THREE) throw lastError || new Error('Failed to import three')
        return THREE;
      }

      function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v))
      }

      function randChoice(arr) {
        return arr[Math.floor(Math.random() * arr.length)]
      }

      function randRange(min, max) {
        return min + Math.random() * (max - min)
      }

      function parseLevel(lines) {
        const h = lines.length;
        const w = Math.max(...lines.map((l) => l.length));
        const grid = [];
        const spawns = {player: null, enemies: [], ammo: [], health: [], key: null, door: null, exit: null};

        for (let z = 0; z < h; z++) {
          const row = (lines[z] || '').padEnd(w, '#');
          const arr = [];
          for (let x = 0; x < w; x++) {
            const c = row[x] || '#';
            arr.push(c);
            if (c === 'P') spawns.player = {x, z};
            if (c === 'E') spawns.enemies.push({x, z});
            if (c === 'A') spawns.ammo.push({x, z});
            if (c === 'H') spawns.health.push({x, z});
            if (c === 'K') spawns.key = {x, z};
            if (c === 'D') spawns.door = {x, z};
            if (c === 'X') spawns.exit = {x, z};
          }
          grid.push(arr);
        }
        return {w, h, grid, spawns};
      }

      function buildWorldToCell({w, h}) {
        const originX = -(w * ${CELL_SIZE}) / 2 + ${CELL_SIZE} / 2;
        const originZ = -(h * ${CELL_SIZE}) / 2 + ${CELL_SIZE} / 2;
        return {
          originX,
          originZ,
          cellToWorld: (x, z) => ({x: originX + x * ${CELL_SIZE}, z: originZ + z * ${CELL_SIZE}}),
          worldToCell: (x, z) => ({
            x: Math.floor((x - originX) / ${CELL_SIZE}),
            z: Math.floor((z - originZ) / ${CELL_SIZE}),
          }),
          cellAabb: (x, z) => {
            const cx = originX + x * ${CELL_SIZE};
            const cz = originZ + z * ${CELL_SIZE};
            const half = ${CELL_SIZE} / 2;
            return {minX: cx - half, maxX: cx + half, minZ: cz - half, maxZ: cz + half, cx, cz};
          },
        };
      }

      function circleVsAabbResolve(pos, radius, aabb) {
        const closestX = clamp(pos.x, aabb.minX, aabb.maxX);
        const closestZ = clamp(pos.z, aabb.minZ, aabb.maxZ);
        let dx = pos.x - closestX;
        let dz = pos.z - closestZ;
        let dist2 = dx * dx + dz * dz;

        if (dist2 === 0) {
          // Inside AABB; push out through the closest face.
          const dLeft = Math.abs(pos.x - aabb.minX);
          const dRight = Math.abs(aabb.maxX - pos.x);
          const dTop = Math.abs(pos.z - aabb.minZ);
          const dBottom = Math.abs(aabb.maxZ - pos.z);
          const m = Math.min(dLeft, dRight, dTop, dBottom);
          if (m === dLeft) dx = -1;
          else if (m === dRight) dx = 1;
          else if (m === dTop) dz = -1;
          else dz = 1;
          dist2 = 1;
        }

        if (dist2 < radius * radius) {
          const dist = Math.sqrt(dist2);
          const push = (radius - dist) / dist;
          pos.x += dx * push;
          pos.z += dz * push;
        }
        return pos;
      }

      function makeGridRaycast({grid, w, h}, transform, isSolidCell) {
        // Amanatides & Woo on grid coordinates.
        return function hasLineOfSight(x0, z0, x1, z1) {
          const a = transform.worldToCell(x0, z0);
          const b = transform.worldToCell(x1, z1);
          let gx0 = (x0 - transform.originX) / ${CELL_SIZE};
          let gz0 = (z0 - transform.originZ) / ${CELL_SIZE};
          const gx1 = (x1 - transform.originX) / ${CELL_SIZE};
          const gz1 = (z1 - transform.originZ) / ${CELL_SIZE};

          let cx = Math.floor(gx0);
          let cz = Math.floor(gz0);
          const tx = Math.floor(gx1);
          const tz = Math.floor(gz1);

          const dx = gx1 - gx0;
          const dz = gz1 - gz0;

          const stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
          const stepZ = dz > 0 ? 1 : dz < 0 ? -1 : 0;

          const invDx = dx !== 0 ? 1 / Math.abs(dx) : Infinity;
          const invDz = dz !== 0 ? 1 / Math.abs(dz) : Infinity;

          let tMaxX = stepX === 0 ? Infinity : (stepX > 0 ? (Math.floor(gx0) + 1 - gx0) : (gx0 - Math.floor(gx0))) * invDx;
          let tMaxZ = stepZ === 0 ? Infinity : (stepZ > 0 ? (Math.floor(gz0) + 1 - gz0) : (gz0 - Math.floor(gz0))) * invDz;
          const tDeltaX = stepX === 0 ? Infinity : invDx;
          const tDeltaZ = stepZ === 0 ? Infinity : invDz;

          // Skip the starting cell; test the traversed cells.
          const maxSteps = 200;
          for (let i = 0; i < maxSteps; i++) {
            if (cx === tx && cz === tz) return true;
            if (tMaxX < tMaxZ) {
              cx += stepX;
              tMaxX += tDeltaX;
            } else {
              cz += stepZ;
              tMaxZ += tDeltaZ;
            }
            if (isSolidCell(cx, cz)) return false;
          }
          return true;
        };
      }

      function createPickupMesh(THREE, kind) {
        if (kind === 'ammo') {
          return new THREE.Mesh(
            new THREE.BoxGeometry(0.7, 0.25, 0.5),
            new THREE.MeshStandardMaterial({color: 0x55ccff, roughness: 0.4, metalness: 0.2, emissive: 0x001622}),
          );
        }
        if (kind === 'key') {
          return new THREE.Mesh(
            new THREE.BoxGeometry(0.65, 0.12, 0.35),
            new THREE.MeshStandardMaterial({color: 0xff3355, roughness: 0.4, metalness: 0.15, emissive: 0x220006}),
          );
        }
        return new THREE.Mesh(
          new THREE.BoxGeometry(0.55, 0.55, 0.55),
          new THREE.MeshStandardMaterial({color: 0x37ff95, roughness: 0.4, metalness: 0.1, emissive: 0x052a18}),
        );
      }

      try {
        const THREE_NS = await loadThree();
        const THREE = THREE_NS;

        const LEVEL = ${levelJson};
        const parsed = parseLevel(LEVEL);
        const transform = buildWorldToCell(parsed);
        const config = window.__DOOM_CONFIG__ || ${initialConfigJson};

        const root = document.getElementById('root');
        const hud = document.getElementById('hud');
        const mapCanvas = document.getElementById('map');
        const mapCtx = mapCanvas ? mapCanvas.getContext('2d') : null;

        const renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        root.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#070a10');

        const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 240);
        camera.rotation.order = 'YXZ';

        scene.add(new THREE.AmbientLight(0xffffff, 0.22));
        const sun = new THREE.DirectionalLight(0xffffff, 0.85);
        sun.position.set(10, 18, 12);
        scene.add(sun);

        const floorW = parsed.w * ${CELL_SIZE};
        const floorH = parsed.h * ${CELL_SIZE};
        const floor = new THREE.Mesh(
          new THREE.PlaneGeometry(floorW, floorH, 1, 1),
          new THREE.MeshStandardMaterial({color: 0x0b1220, roughness: 1, metalness: 0}),
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        scene.add(floor);

        const ceiling = new THREE.Mesh(
          new THREE.PlaneGeometry(floorW, floorH, 1, 1),
          new THREE.MeshStandardMaterial({color: 0x0a0f18, roughness: 1, metalness: 0, side: THREE.DoubleSide}),
        );
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = ${WALL_HEIGHT};
        scene.add(ceiling);

        const wallGeom = new THREE.BoxGeometry(${CELL_SIZE}, ${WALL_HEIGHT}, ${CELL_SIZE});
        const wallMat = new THREE.MeshStandardMaterial({color: 0x162034, roughness: 0.92, metalness: 0.05});

        const wallCells = [];
        for (let z = 0; z < parsed.h; z++) {
          for (let x = 0; x < parsed.w; x++) {
            const c = parsed.grid[z][x];
            if (c === '#') wallCells.push({x, z});
          }
        }

        const wallMesh = new THREE.InstancedMesh(wallGeom, wallMat, wallCells.length);
        const tmpM = new THREE.Matrix4();
        for (let i = 0; i < wallCells.length; i++) {
          const p = transform.cellToWorld(wallCells[i].x, wallCells[i].z);
          tmpM.makeTranslation(p.x, ${WALL_HEIGHT} / 2, p.z);
          wallMesh.setMatrixAt(i, tmpM);
        }
        scene.add(wallMesh);

        const door = {
          cell: parsed.spawns.door,
          open: 0,
          opening: false,
          mesh: null,
        };
        if (door.cell) {
          const p = transform.cellToWorld(door.cell.x, door.cell.z);
          const m = new THREE.Mesh(
            new THREE.BoxGeometry(${CELL_SIZE}, ${WALL_HEIGHT}, 0.5),
            new THREE.MeshStandardMaterial({color: 0x2a3a55, roughness: 0.7, metalness: 0.1, emissive: 0x05090f}),
          );
          m.position.set(p.x, ${WALL_HEIGHT} / 2, p.z);
          door.mesh = m;
          scene.add(m);
        }

        const player = {
          pos: {x: 0, z: 0},
          yaw: 0,
          pitch: 0,
          health: 100,
          score: 0,
          shells: 10,
          hasKey: false,
          weapon: 'pistol',
          shootCooldown: 0,
          useCooldown: 0,
          paused: false,
          status: 'Find the key. Open the door. Reach the exit.',
        };

        const spawnPlayerCell = parsed.spawns.player || {x: 1, z: 1};
        {
          const p = transform.cellToWorld(spawnPlayerCell.x, spawnPlayerCell.z);
          player.pos.x = p.x;
          player.pos.z = p.z;
          camera.position.set(p.x, ${EYE_HEIGHT}, p.z);
        }

        function isSolidCell(cx, cz) {
          if (cx < 0 || cz < 0 || cx >= parsed.w || cz >= parsed.h) return true;
          const c = parsed.grid[cz][cx];
          if (c === '#') return true;
          if (c === 'D') return door.mesh && door.open < 0.95;
          return false;
        }

        const hasLineOfSight = makeGridRaycast(parsed, transform, isSolidCell);

        function resolveCollisions(pos, radius) {
          const cell = transform.worldToCell(pos.x, pos.z);
          for (let iter = 0; iter < 3; iter++) {
            for (let dz = -1; dz <= 1; dz++) {
              for (let dx = -1; dx <= 1; dx++) {
                const cx = cell.x + dx;
                const cz = cell.z + dz;
                if (!isSolidCell(cx, cz)) continue;
                const aabb = transform.cellAabb(cx, cz);
                circleVsAabbResolve(pos, radius, aabb);
              }
            }
          }
          return pos;
        }

        // Pickups
        const pickups = [];
        function addPickup(kind, cell) {
          const p = transform.cellToWorld(cell.x, cell.z);
          const mesh = createPickupMesh(THREE, kind);
          mesh.position.set(p.x, 0.55, p.z);
          mesh.name = 'pickup';
          mesh.userData = {kind};
          scene.add(mesh);
          pickups.push({kind, mesh, pos: {x: p.x, z: p.z}});
        }
        for (const cell of parsed.spawns.ammo) addPickup('ammo', cell);
        for (const cell of parsed.spawns.health) addPickup('health', cell);
        if (parsed.spawns.key) addPickup('key', parsed.spawns.key);

        // Enemies
        const enemyTypes = [
          {kind: 'imp', label: 'Imp', hp: 35, speed: 1.4, ranged: true, damage: 10, projectileSpeed: 7, cooldown: [1.2, 2.0], radius: 0.45, color: 0xff6a00},
          {kind: 'demon', label: 'Demon', hp: 70, speed: 2.2, ranged: false, damage: 18, projectileSpeed: 0, cooldown: [0.9, 1.4], radius: 0.55, color: 0x9b59ff},
        ];
        const enemySpawns = parsed.spawns.enemies.length > 0 ? parsed.spawns.enemies : [{x: spawnPlayerCell.x + 6, z: spawnPlayerCell.z}];

        const enemies = [];
        function spawnEnemyAt(cell, type) {
          const p = transform.cellToWorld(cell.x, cell.z);
          const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(type.radius, 18, 18),
            new THREE.MeshStandardMaterial({color: type.color, roughness: 0.6, metalness: 0.05, emissive: 0x000000}),
          );
          mesh.position.set(p.x, 1.0, p.z);
          mesh.name = 'enemy';
          scene.add(mesh);
          enemies.push({
            type,
            mesh,
            hp: type.hp,
            cooldown: randRange(type.cooldown[0], type.cooldown[1]),
            hitFlash: 0,
            pos: {x: p.x, z: p.z},
            alive: true,
            respawn: 0,
          });
        }

        for (let i = 0; i < Math.min(config.enemyCount, 24); i++) {
          spawnEnemyAt(enemySpawns[i % enemySpawns.length], randChoice(enemyTypes));
        }

        // Enemy projectiles
        const projectiles = [];
        function spawnProjectile(fromX, fromZ, toX, toZ, damage, speed) {
          const dirX = toX - fromX;
          const dirZ = toZ - fromZ;
          const len = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1;
          const vx = (dirX / len) * speed;
          const vz = (dirZ / len) * speed;

          const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.16, 10, 10),
            new THREE.MeshStandardMaterial({color: 0xff3355, emissive: 0x33000a, roughness: 0.2}),
          );
          mesh.position.set(fromX, 1.2, fromZ);
          scene.add(mesh);
          projectiles.push({mesh, x: fromX, z: fromZ, vx, vz, damage, life: 4});
        }

        // Controls
        const input = {w: false, a: false, s: false, d: false}
        function bindBtn(id, key) {
          const el = document.getElementById(id);
          if (!el) return;
          const down = (e) => { e.preventDefault(); input[key] = true; };
          const up = (e) => { e.preventDefault(); input[key] = false; };
          el.addEventListener('pointerdown', down);
          el.addEventListener('pointerup', up);
          el.addEventListener('pointercancel', up);
          el.addEventListener('pointerleave', up);
        }
        bindBtn('btnW', 'w');
        bindBtn('btnA', 'a');
        bindBtn('btnS', 's');
        bindBtn('btnD', 'd');

        const fireBtn = document.getElementById('btnFire');
        const useBtn = document.getElementById('btnUse');
        const weaponBtn = document.getElementById('btnWeapon');

        // Look: drag on right half (outside controls)
        let lookPointerId = null;
        let lastX = 0;
        let lastY = 0;
        root.addEventListener('pointerdown', (e) => {
          const rect = root.getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x < rect.width * 0.42) return;
          lookPointerId = e.pointerId;
          lastX = e.clientX;
          lastY = e.clientY;
        });
        root.addEventListener('pointermove', (e) => {
          if (lookPointerId == null || e.pointerId !== lookPointerId) return;
          const dx = e.clientX - lastX;
          const dy = e.clientY - lastY;
          lastX = e.clientX;
          lastY = e.clientY;
          const ls = Number(window.__DOOM_CONFIG__ && window.__DOOM_CONFIG__.lookSpeed);
          const lookSpeed = isFinite(ls) ? ls : 1.25;
          player.yaw -= dx * 0.0022 * lookSpeed;
          player.pitch -= dy * 0.0022 * lookSpeed;
          player.pitch = clamp(player.pitch, -1.25, 1.25);
        });
        const clearLook = (e) => {
          if (lookPointerId == null) return;
          if (e && e.pointerId !== lookPointerId) return;
          lookPointerId = null;
        };
        root.addEventListener('pointerup', clearLook);
        root.addEventListener('pointercancel', clearLook);

        function sendState() {
          postToHost({
            type: 'event/state',
            payload: {
              health: player.health,
              score: player.score,
              shells: player.shells,
              weapon: player.weapon,
              hasKey: player.hasKey,
              paused: player.paused,
              status: player.status,
            },
          });
        }

        function setStatus(text) {
          player.status = text;
        }

        function updateHud() {
          const weaponLabel = (WEAPONS && WEAPONS[player.weapon] && WEAPONS[player.weapon].label) ? WEAPONS[player.weapon].label : player.weapon;
          const keyText = player.hasKey ? 'Key: YES' : 'Key: NO';
          const ammoText = player.weapon === 'shotgun' ? ('Shells: ' + player.shells) : 'Ammo: ∞';
          const pauseText = player.paused ? 'PAUSED' : '';
          hud.textContent =
            'HP ' + player.health + '  •  Score ' + player.score + '\\n' +
            weaponLabel + '  •  ' + ammoText + '\\n' +
            keyText + (pauseText ? ('  •  ' + pauseText) : '') + '\\n' +
            player.status;
        }

        function drawMinimap() {
          if (!mapCtx) return;
          const w = parsed.w;
          const h = parsed.h;
          mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
          mapCtx.fillStyle = 'rgba(0,0,0,0.15)';
          mapCtx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);

          const scale = Math.min(mapCanvas.width / w, mapCanvas.height / h);
          const ox = (mapCanvas.width - w * scale) / 2;
          const oz = (mapCanvas.height - h * scale) / 2;

          for (let z = 0; z < h; z++) {
            for (let x = 0; x < w; x++) {
              const c = parsed.grid[z][x];
              if (c === '#') {
                mapCtx.fillStyle = 'rgba(255,255,255,0.22)';
                mapCtx.fillRect(ox + x * scale, oz + z * scale, scale, scale);
              } else if (c === 'D') {
                mapCtx.fillStyle = door.open < 0.95 ? 'rgba(55,255,149,0.30)' : 'rgba(55,255,149,0.10)';
                mapCtx.fillRect(ox + x * scale, oz + z * scale, scale, scale);
              } else if (c === 'X') {
                mapCtx.fillStyle = 'rgba(255,215,0,0.35)';
                mapCtx.fillRect(ox + x * scale, oz + z * scale, scale, scale);
              }
            }
          }

          // Player
          const pc = transform.worldToCell(player.pos.x, player.pos.z);
          mapCtx.fillStyle = 'rgba(55,255,149,0.95)';
          mapCtx.fillRect(ox + pc.x * scale + scale * 0.2, oz + pc.z * scale + scale * 0.2, scale * 0.6, scale * 0.6);

          // Enemies
          mapCtx.fillStyle = 'rgba(255,106,0,0.85)';
          for (const e of enemies) {
            if (!e.alive) continue;
            const ec = transform.worldToCell(e.pos.x, e.pos.z);
            mapCtx.fillRect(ox + ec.x * scale + scale * 0.3, oz + ec.z * scale + scale * 0.3, scale * 0.4, scale * 0.4);
          }
        }

        // Shooting
        const raycaster = new THREE.Raycaster();
        function dealDamage(enemy, amount) {
          enemy.hp -= amount;
          enemy.hitFlash = 0.15;
          if (enemy.hp <= 0) {
            enemy.alive = false;
            enemy.respawn = 2.8;
            enemy.mesh.visible = false;
            player.score += 1;
            setStatus('Fragged a ' + enemy.type.label + '!');
            // Drop chance
            const r = Math.random();
            if (r < 0.22) addPickup('health', transform.worldToCell(enemy.pos.x, enemy.pos.z));
            else if (r < 0.55) addPickup('ammo', transform.worldToCell(enemy.pos.x, enemy.pos.z));
            sendState();
          }
        }

        function shoot() {
          if (player.paused) return;
          if (player.health <= 0) return;
          if (player.shootCooldown > 0) return;

          const weapon = WEAPONS[player.weapon] || WEAPONS.pistol;
          if (weapon.usesShells && player.shells <= 0) {
            setStatus('Out of shells!');
            return;
          }

          player.shootCooldown = weapon.cooldown;
          if (weapon.usesShells) player.shells = Math.max(0, player.shells - 1);

          const hitsBefore = player.score;

          for (let i = 0; i < weapon.pellets; i++) {
            const spreadX = weapon.spread ? randRange(-weapon.spread, weapon.spread) : 0;
            const spreadY = weapon.spread ? randRange(-weapon.spread, weapon.spread) : 0;
            raycaster.setFromCamera(new THREE.Vector2(spreadX, spreadY), camera);
            const hit = raycaster.intersectObjects(enemies.filter((e) => e.alive).map((e) => e.mesh), false)[0];
            if (hit && hit.object) {
              const enemy = enemies.find((e) => e.mesh === hit.object);
              if (enemy && enemy.alive) dealDamage(enemy, weapon.damage);
            }
          }

          if (player.score === hitsBefore) setStatus('Miss!');
          sendState();
        }

        // Use (door / exit)
        function use() {
          if (player.paused) return;
          if (player.useCooldown > 0) return;
          player.useCooldown = 0.25;

          // Door
          if (door.mesh && door.cell) {
            const dp = transform.cellToWorld(door.cell.x, door.cell.z);
            const dx = dp.x - player.pos.x;
            const dz = dp.z - player.pos.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < 2.0) {
              if (!player.hasKey) {
                setStatus('Door locked. Find the key.');
                return;
              }
              door.opening = true;
              setStatus('Door opening…');
              return;
            }
          }

          // Exit
          if (parsed.spawns.exit) {
            const ep = transform.cellToWorld(parsed.spawns.exit.x, parsed.spawns.exit.z);
            const dx = ep.x - player.pos.x;
            const dz = ep.z - player.pos.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < 2.0) {
              setStatus('Exit reached! Reset to play again.');
              player.paused = true;
              sendState();
            }
          }
        }

        function cycleWeapon() {
          player.weapon = player.weapon === 'pistol' ? 'shotgun' : 'pistol';
          setStatus('Weapon: ' + (WEAPONS[player.weapon]?.label || player.weapon));
          sendState();
        }

        if (fireBtn) fireBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); shoot(); });
        if (useBtn) useBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); use(); });
        if (weaponBtn) weaponBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); cycleWeapon(); });

        function togglePause() {
          player.paused = !player.paused;
          setStatus(player.paused ? 'Paused' : 'Back to it!');
          sendState();
        }

        function reset() {
          player.health = 100;
          player.score = 0;
          player.shells = 10;
          player.hasKey = false;
          player.weapon = 'pistol';
          player.shootCooldown = 0;
          player.useCooldown = 0;
          player.paused = false;
          door.open = 0;
          door.opening = false;
          setStatus('Find the key. Open the door. Reach the exit.');

          const p = transform.cellToWorld(spawnPlayerCell.x, spawnPlayerCell.z);
          player.pos.x = p.x;
          player.pos.z = p.z;
          player.yaw = 0;
          player.pitch = 0;

          // Reset pickups
          while (pickups.length > 0) {
            const p = pickups.pop();
            scene.remove(p.mesh);
          }
          for (const cell of parsed.spawns.ammo) addPickup('ammo', cell);
          for (const cell of parsed.spawns.health) addPickup('health', cell);
          if (parsed.spawns.key) addPickup('key', parsed.spawns.key);

          // Reset enemies
          for (const e of enemies) {
            e.hp = e.type.hp;
            e.cooldown = randRange(e.type.cooldown[0], e.type.cooldown[1]);
            e.hitFlash = 0;
            e.alive = true;
            e.respawn = 0;
            const spawn = randChoice(enemySpawns);
            const wp = transform.cellToWorld(spawn.x, spawn.z);
            e.pos.x = wp.x;
            e.pos.z = wp.z;
            e.mesh.position.set(wp.x, 1.0, wp.z);
            e.mesh.visible = true;
          }

          // Clear projectiles
          while (projectiles.length > 0) {
            const pr = projectiles.pop();
            scene.remove(pr.mesh);
          }

          sendState();
        }

        function applyConfig(next) {
          const cfg = Object.assign({}, window.__DOOM_CONFIG__ || {}, next || {});
          window.__DOOM_CONFIG__ = cfg;
          return cfg;
        }

        function resize() {
          const w = root.clientWidth || window.innerWidth || 1;
          const h = root.clientHeight || window.innerHeight || 1;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        }

        function step(dt) {
          if (player.paused) return;

          const cfg = window.__DOOM_CONFIG__ || config;
          const moveSpeed = Number(cfg.moveSpeed) || 4.4;
          const enemyMult = Number(cfg.difficulty) || 1;

          if (player.shootCooldown > 0) player.shootCooldown -= dt;
          if (player.useCooldown > 0) player.useCooldown -= dt;

          // Door anim
          if (door.mesh && door.opening && door.open < 1) {
            door.open = Math.min(1, door.open + dt * 0.9);
            door.mesh.position.y = ${WALL_HEIGHT} / 2 + door.open * ${WALL_HEIGHT};
          }

          camera.position.set(player.pos.x, ${EYE_HEIGHT}, player.pos.z);
          camera.rotation.y = player.yaw;
          camera.rotation.x = player.pitch;

          // Player movement
          const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, player.yaw, 0));
          const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, player.yaw, 0));
          const v = new THREE.Vector3(0, 0, 0);
          if (input.w) v.add(forward);
          if (input.s) v.sub(forward);
          if (input.d) v.add(right);
          if (input.a) v.sub(right);
          if (v.lengthSq() > 0) {
            v.normalize().multiplyScalar(moveSpeed * dt);
            player.pos.x += v.x;
            player.pos.z += v.z;
            resolveCollisions(player.pos, ${PLAYER_RADIUS});
          }

          // Pickups
          for (let i = pickups.length - 1; i >= 0; i--) {
            const p = pickups[i];
            p.mesh.rotation.y += dt * 1.2;
            const dx = p.pos.x - player.pos.x;
            const dz = p.pos.z - player.pos.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < 1.1) {
              if (p.kind === 'health') {
                player.health = Math.min(100, player.health + 25);
                setStatus('Picked up health!');
              } else if (p.kind === 'ammo') {
                player.shells = Math.min(50, player.shells + 6);
                setStatus('Picked up shells!');
              } else if (p.kind === 'key') {
                player.hasKey = true;
                setStatus('Got the key!');
              }
              scene.remove(p.mesh);
              pickups.splice(i, 1);
              sendState();
            }
          }

          // Enemies
          for (const e of enemies) {
            if (!e.alive) {
              e.respawn -= dt;
              if (e.respawn <= 0) {
                e.alive = true;
                e.hp = e.type.hp;
                e.cooldown = randRange(e.type.cooldown[0], e.type.cooldown[1]);
                const spawn = randChoice(enemySpawns);
                const wp = transform.cellToWorld(spawn.x, spawn.z);
                e.pos.x = wp.x;
                e.pos.z = wp.z;
                e.mesh.position.set(wp.x, 1.0, wp.z);
                e.mesh.visible = true;
              }
              continue;
            }

            if (e.hitFlash > 0) {
              e.hitFlash -= dt;
              e.mesh.material.emissive = new THREE.Color(0x220000);
            } else {
              e.mesh.material.emissive = new THREE.Color(0x000000);
            }

            const dx = player.pos.x - e.pos.x;
            const dz = player.pos.z - e.pos.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            const sees = dist < 16 && hasLineOfSight(e.pos.x, e.pos.z, player.pos.x, player.pos.z);

            // Chase
            if (sees && player.health > 0) {
              const dirX = dx / (dist || 1);
              const dirZ = dz / (dist || 1);
              e.pos.x += dirX * e.type.speed * enemyMult * dt;
              e.pos.z += dirZ * e.type.speed * enemyMult * dt;
              resolveCollisions(e.pos, e.type.radius);
              e.mesh.position.set(e.pos.x, 1.0, e.pos.z);
            }

            // Attack
            e.cooldown -= dt;
            if (e.cooldown <= 0 && sees && player.health > 0) {
              if (!e.type.ranged && dist < 1.2) {
                player.health = Math.max(0, player.health - Math.round(e.type.damage * enemyMult));
                setStatus(e.type.label + ' hits you!');
                e.cooldown = randRange(e.type.cooldown[0], e.type.cooldown[1]);
                sendState();
              } else if (e.type.ranged && dist < 11) {
                spawnProjectile(e.pos.x, e.pos.z, player.pos.x, player.pos.z, Math.round(e.type.damage * enemyMult), e.type.projectileSpeed);
                e.cooldown = randRange(e.type.cooldown[0], e.type.cooldown[1]);
              }
            }
          }

          // Projectiles
          for (let i = projectiles.length - 1; i >= 0; i--) {
            const pr = projectiles[i];
            pr.life -= dt;
            pr.x += pr.vx * dt;
            pr.z += pr.vz * dt;
            pr.mesh.position.set(pr.x, 1.2, pr.z);

            const dx = pr.x - player.pos.x;
            const dz = pr.z - player.pos.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < 0.55 && player.health > 0 && !player.paused) {
              player.health = Math.max(0, player.health - pr.damage);
              setStatus('Hit by fireball!');
              scene.remove(pr.mesh);
              projectiles.splice(i, 1);
              sendState();
              continue;
            }

            const cell = transform.worldToCell(pr.x, pr.z);
            if (isSolidCell(cell.x, cell.z) || pr.life <= 0) {
              scene.remove(pr.mesh);
              projectiles.splice(i, 1);
            }
          }

          // Exit auto prompt
          if (parsed.spawns.exit && player.health > 0 && !player.paused) {
            const ep = transform.cellToWorld(parsed.spawns.exit.x, parsed.spawns.exit.z);
            const dx = ep.x - player.pos.x;
            const dz = ep.z - player.pos.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < 2.2) setStatus('Exit is here. USE to finish!');
          }

          // Game over
          if (player.health <= 0 && !player.paused) {
            player.paused = true;
            setStatus('Game over. Reset to try again.');
            sendState();
          }
        }

        // API for host control
        window.__DOOM_API__ = {reset, togglePause, applyConfig};

        resize();
        window.addEventListener('resize', resize);
        postToHost({type: 'event/ready', payload: {renderer: 'webgl', threeVersion: THREE.REVISION, loadedFrom}});
        sendState();

        let lastTime = performance.now();
        let lastUi = 0;
        function tick(now) {
          const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
          lastTime = now;
          resize();
          step(dt);
          renderer.render(scene, camera);

          if (now - lastUi > 110) {
            lastUi = now;
            updateHud();
            drawMinimap();
          }

          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      } catch (e) {
        postToHost({
          type: 'event/error',
          payload: {
            message: 'Doom FPS WebView failed to start.',
            attempted: attempted,
            loadedFrom: loadedFrom,
            error: String(e && (e.message || e) || e),
          },
        });
        const hud = document.getElementById('hud');
        if (hud) hud.textContent = 'Error: ' + String(e && (e.message || e) || e);
      }
    </script>
  </body>
</html>`
}

export const rootOptions = {disableScrollView: true}

export default function DoomFps({
  title = 'Doom FPS (prototype)',
  moveSpeed = '4.4',
  lookSpeed = '1.25',
  enemyCount = '10',
  difficulty = '1',
}) {
  const webViewRef = useRef(null)
  const canvasHostRef = useRef(null)
  const webGameRef = useRef(null)

  const [statusText, setStatusText] = useState('Loading…')
  const [health, setHealth] = useState(100)
  const [score, setScore] = useState(0)
  const [shells, setShells] = useState(10)
  const [weapon, setWeapon] = useState('pistol')
  const [hasKey, setHasKey] = useState(false)
  const [paused, setPaused] = useState(false)
  const [webPointerLocked, setWebPointerLocked] = useState(false)

  const config = useMemo(() => buildConfig({moveSpeed, lookSpeed, enemyCount, difficulty}), [
    moveSpeed,
    lookSpeed,
    enemyCount,
    difficulty,
  ])

  const html = useMemo(() => createDoomHtml({initialConfig: config, levelLines: DEFAULT_LEVEL}), [config])

  function resetGame() {
    if (Platform.OS === 'web') {
      webGameRef.current?.reset?.()
      return
    }
    webViewRef.current?.postMessage?.(JSON.stringify({type: 'cmd/reset'}))
  }

  function togglePause() {
    if (Platform.OS === 'web') {
      webGameRef.current?.togglePause?.()
      return
    }
    webViewRef.current?.postMessage?.(JSON.stringify({type: 'cmd/togglePause'}))
  }

  function handleSceneMessage(msg) {
    if (!msg || typeof msg.type !== 'string') return

    if (msg.type === 'event/ready') {
      setStatusText(`Ready (${msg?.payload?.renderer || 'renderer'})`)
      return
    }

    if (msg.type === 'event/state') {
      if (typeof msg?.payload?.health === 'number') setHealth(msg.payload.health)
      if (typeof msg?.payload?.score === 'number') setScore(msg.payload.score)
      if (typeof msg?.payload?.shells === 'number') setShells(msg.payload.shells)
      if (typeof msg?.payload?.weapon === 'string') setWeapon(msg.payload.weapon)
      if (typeof msg?.payload?.hasKey === 'boolean') setHasKey(msg.payload.hasKey)
      if (typeof msg?.payload?.paused === 'boolean') setPaused(msg.payload.paused)
      if (typeof msg?.payload?.status === 'string') setStatusText(msg.payload.status)
      return
    }

    if (msg.type === 'event/error') {
      setStatusText(`Error: ${msg?.payload?.message || 'unknown error'}`)
    }
  }

  useEffect(() => {
    if (Platform.OS !== 'web') return

    const host = canvasHostRef.current
    if (!host) return

    let cleanup = null

    ;(async () => {
      try {
        const THREE = await import('three')

        const parsed = (() => {
          const lines = DEFAULT_LEVEL
          const h = lines.length
          const w = Math.max(...lines.map((l) => l.length))
          const grid = []
          const spawns = {player: null, enemies: [], ammo: [], health: [], key: null, door: null, exit: null}

          for (let z = 0; z < h; z++) {
            const row = (lines[z] || '').padEnd(w, '#')
            const arr = []
            for (let x = 0; x < w; x++) {
              const c = row[x] || '#'
              arr.push(c)
              if (c === 'P') spawns.player = {x, z}
              if (c === 'E') spawns.enemies.push({x, z})
              if (c === 'A') spawns.ammo.push({x, z})
              if (c === 'H') spawns.health.push({x, z})
              if (c === 'K') spawns.key = {x, z}
              if (c === 'D') spawns.door = {x, z}
              if (c === 'X') spawns.exit = {x, z}
            }
            grid.push(arr)
          }
          return {w, h, grid, spawns}
        })()

        const originX = -(parsed.w * CELL_SIZE) / 2 + CELL_SIZE / 2
        const originZ = -(parsed.h * CELL_SIZE) / 2 + CELL_SIZE / 2
        const cellToWorld = (x, z) => ({x: originX + x * CELL_SIZE, z: originZ + z * CELL_SIZE})
        const worldToCell = (x, z) => ({x: Math.floor((x - originX) / CELL_SIZE), z: Math.floor((z - originZ) / CELL_SIZE)})
        const cellAabb = (x, z) => {
          const cx = originX + x * CELL_SIZE
          const cz = originZ + z * CELL_SIZE
          const half = CELL_SIZE / 2
          return {minX: cx - half, maxX: cx + half, minZ: cz - half, maxZ: cz + half, cx, cz}
        }

        const renderer = new THREE.WebGLRenderer({antialias: true, alpha: false})
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        renderer.domElement.style.width = '100%'
        renderer.domElement.style.height = '100%'
        renderer.domElement.style.display = 'block'
        host.appendChild(renderer.domElement)

        const scene = new THREE.Scene()
        scene.background = new THREE.Color('#070a10')

        const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 240)
        camera.rotation.order = 'YXZ'

        scene.add(new THREE.AmbientLight(0xffffff, 0.22))
        const sun = new THREE.DirectionalLight(0xffffff, 0.85)
        sun.position.set(10, 18, 12)
        scene.add(sun)

        const floorW = parsed.w * CELL_SIZE
        const floorH = parsed.h * CELL_SIZE
        const floor = new THREE.Mesh(
          new THREE.PlaneGeometry(floorW, floorH, 1, 1),
          new THREE.MeshStandardMaterial({color: 0x0b1220, roughness: 1, metalness: 0}),
        )
        floor.rotation.x = -Math.PI / 2
        floor.position.y = 0
        scene.add(floor)

        const ceiling = new THREE.Mesh(
          new THREE.PlaneGeometry(floorW, floorH, 1, 1),
          new THREE.MeshStandardMaterial({color: 0x0a0f18, roughness: 1, metalness: 0, side: THREE.DoubleSide}),
        )
        ceiling.rotation.x = Math.PI / 2
        ceiling.position.y = WALL_HEIGHT
        scene.add(ceiling)

        const wallGeom = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE)
        const wallMat = new THREE.MeshStandardMaterial({color: 0x162034, roughness: 0.92, metalness: 0.05})

        const wallCells = []
        for (let z = 0; z < parsed.h; z++) {
          for (let x = 0; x < parsed.w; x++) {
            if (parsed.grid[z][x] === '#') wallCells.push({x, z})
          }
        }

        const wallMesh = new THREE.InstancedMesh(wallGeom, wallMat, wallCells.length)
        const tmpM = new THREE.Matrix4()
        for (let i = 0; i < wallCells.length; i++) {
          const p = cellToWorld(wallCells[i].x, wallCells[i].z)
          tmpM.makeTranslation(p.x, WALL_HEIGHT / 2, p.z)
          wallMesh.setMatrixAt(i, tmpM)
        }
        scene.add(wallMesh)

        const door = {cell: parsed.spawns.door, open: 0, opening: false, mesh: null}
        if (door.cell) {
          const p = cellToWorld(door.cell.x, door.cell.z)
          const m = new THREE.Mesh(
            new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, 0.5),
            new THREE.MeshStandardMaterial({color: 0x2a3a55, roughness: 0.7, metalness: 0.1, emissive: 0x05090f}),
          )
          m.position.set(p.x, WALL_HEIGHT / 2, p.z)
          door.mesh = m
          scene.add(m)
        }

        const player = {
          pos: {x: 0, z: 0},
          yaw: 0,
          pitch: 0,
          health: 100,
          score: 0,
          shells: 10,
          hasKey: false,
          weapon: 'pistol',
          shootCooldown: 0,
          useCooldown: 0,
          paused: false,
          status: 'Find the key. Open the door. Reach the exit.',
        }

        const spawnPlayerCell = parsed.spawns.player || {x: 1, z: 1}
        {
          const p = cellToWorld(spawnPlayerCell.x, spawnPlayerCell.z)
          player.pos.x = p.x
          player.pos.z = p.z
          camera.position.set(p.x, EYE_HEIGHT, p.z)
        }

        function isSolidCell(cx, cz) {
          if (cx < 0 || cz < 0 || cx >= parsed.w || cz >= parsed.h) return true
          const c = parsed.grid[cz][cx]
          if (c === '#') return true
          if (c === 'D') return door.mesh && door.open < 0.95
          return false
        }

        function circleVsAabbResolve(pos, radius, aabb) {
          const closestX = clampNumber(pos.x, {min: aabb.minX, max: aabb.maxX, fallback: pos.x})
          const closestZ = clampNumber(pos.z, {min: aabb.minZ, max: aabb.maxZ, fallback: pos.z})
          let dx = pos.x - closestX
          let dz = pos.z - closestZ
          let dist2 = dx * dx + dz * dz

          if (dist2 === 0) {
            const dLeft = Math.abs(pos.x - aabb.minX)
            const dRight = Math.abs(aabb.maxX - pos.x)
            const dTop = Math.abs(pos.z - aabb.minZ)
            const dBottom = Math.abs(aabb.maxZ - pos.z)
            const m = Math.min(dLeft, dRight, dTop, dBottom)
            if (m === dLeft) dx = -1
            else if (m === dRight) dx = 1
            else if (m === dTop) dz = -1
            else dz = 1
            dist2 = 1
          }

          if (dist2 < radius * radius) {
            const dist = Math.sqrt(dist2)
            const push = (radius - dist) / dist
            pos.x += dx * push
            pos.z += dz * push
          }
          return pos
        }

        function resolveCollisions(pos, radius) {
          const cell = worldToCell(pos.x, pos.z)
          for (let iter = 0; iter < 3; iter++) {
            for (let dz = -1; dz <= 1; dz++) {
              for (let dx = -1; dx <= 1; dx++) {
                const cx = cell.x + dx
                const cz = cell.z + dz
                if (!isSolidCell(cx, cz)) continue
                circleVsAabbResolve(pos, radius, cellAabb(cx, cz))
              }
            }
          }
          return pos
        }

        function hasLineOfSight(x0, z0, x1, z1) {
          let gx0 = (x0 - originX) / CELL_SIZE
          let gz0 = (z0 - originZ) / CELL_SIZE
          const gx1 = (x1 - originX) / CELL_SIZE
          const gz1 = (z1 - originZ) / CELL_SIZE

          let cx = Math.floor(gx0)
          let cz = Math.floor(gz0)
          const tx = Math.floor(gx1)
          const tz = Math.floor(gz1)

          const dx = gx1 - gx0
          const dz = gz1 - gz0

          const stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0
          const stepZ = dz > 0 ? 1 : dz < 0 ? -1 : 0

          const invDx = dx !== 0 ? 1 / Math.abs(dx) : Infinity
          const invDz = dz !== 0 ? 1 / Math.abs(dz) : Infinity

          let tMaxX =
            stepX === 0
              ? Infinity
              : (stepX > 0 ? Math.floor(gx0) + 1 - gx0 : gx0 - Math.floor(gx0)) * invDx
          let tMaxZ =
            stepZ === 0
              ? Infinity
              : (stepZ > 0 ? Math.floor(gz0) + 1 - gz0 : gz0 - Math.floor(gz0)) * invDz
          const tDeltaX = stepX === 0 ? Infinity : invDx
          const tDeltaZ = stepZ === 0 ? Infinity : invDz

          for (let i = 0; i < 200; i++) {
            if (cx === tx && cz === tz) return true
            if (tMaxX < tMaxZ) {
              cx += stepX
              tMaxX += tDeltaX
            } else {
              cz += stepZ
              tMaxZ += tDeltaZ
            }
            if (isSolidCell(cx, cz)) return false
          }
          return true
        }

        function createPickupMesh(kind) {
          if (kind === 'ammo') {
            return new THREE.Mesh(
              new THREE.BoxGeometry(0.7, 0.25, 0.5),
              new THREE.MeshStandardMaterial({color: 0x55ccff, roughness: 0.4, metalness: 0.2, emissive: 0x001622}),
            )
          }
          if (kind === 'key') {
            return new THREE.Mesh(
              new THREE.BoxGeometry(0.65, 0.12, 0.35),
              new THREE.MeshStandardMaterial({color: 0xff3355, roughness: 0.4, metalness: 0.15, emissive: 0x220006}),
            )
          }
          return new THREE.Mesh(
            new THREE.BoxGeometry(0.55, 0.55, 0.55),
            new THREE.MeshStandardMaterial({color: 0x37ff95, roughness: 0.4, metalness: 0.1, emissive: 0x052a18}),
          )
        }

        const pickups = []
        function addPickup(kind, cell) {
          const p = cellToWorld(cell.x, cell.z)
          const mesh = createPickupMesh(kind)
          mesh.position.set(p.x, 0.55, p.z)
          scene.add(mesh)
          pickups.push({kind, mesh, pos: {x: p.x, z: p.z}})
        }
        for (const cell of parsed.spawns.ammo) addPickup('ammo', cell)
        for (const cell of parsed.spawns.health) addPickup('health', cell)
        if (parsed.spawns.key) addPickup('key', parsed.spawns.key)

        const enemyTypes = [
          {
            kind: 'imp',
            label: 'Imp',
            hp: 35,
            speed: 1.4,
            ranged: true,
            damage: 10,
            projectileSpeed: 7,
            cooldown: [1.2, 2.0],
            radius: 0.45,
            color: 0xff6a00,
          },
          {
            kind: 'demon',
            label: 'Demon',
            hp: 70,
            speed: 2.2,
            ranged: false,
            damage: 18,
            projectileSpeed: 0,
            cooldown: [0.9, 1.4],
            radius: 0.55,
            color: 0x9b59ff,
          },
        ]
        const enemySpawns = parsed.spawns.enemies.length > 0 ? parsed.spawns.enemies : [{x: spawnPlayerCell.x + 6, z: spawnPlayerCell.z}]

        function randChoice(arr) {
          return arr[Math.floor(Math.random() * arr.length)]
        }
        function randRange(min, max) {
          return min + Math.random() * (max - min)
        }

        const enemies = []
        function spawnEnemyAt(cell, type) {
          const p = cellToWorld(cell.x, cell.z)
          const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(type.radius, 18, 18),
            new THREE.MeshStandardMaterial({color: type.color, roughness: 0.6, metalness: 0.05, emissive: 0x000000}),
          )
          mesh.position.set(p.x, 1.0, p.z)
          scene.add(mesh)
          enemies.push({type, mesh, hp: type.hp, cooldown: randRange(type.cooldown[0], type.cooldown[1]), hitFlash: 0, pos: {x: p.x, z: p.z}, alive: true, respawn: 0})
        }

        for (let i = 0; i < Math.min(config.enemyCount, 24); i++) {
          spawnEnemyAt(enemySpawns[i % enemySpawns.length], randChoice(enemyTypes))
        }

        const projectiles = []
        function spawnProjectile(fromX, fromZ, toX, toZ, damage, speed) {
          const dirX = toX - fromX
          const dirZ = toZ - fromZ
          const len = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1
          const vx = (dirX / len) * speed
          const vz = (dirZ / len) * speed

          const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.16, 10, 10),
            new THREE.MeshStandardMaterial({color: 0xff3355, emissive: 0x33000a, roughness: 0.2}),
          )
          mesh.position.set(fromX, 1.2, fromZ)
          scene.add(mesh)
          projectiles.push({mesh, x: fromX, z: fromZ, vx, vz, damage, life: 4})
        }

        const input = {w: false, a: false, s: false, d: false, shift: false}
        function onKeyDown(e) {
          const k = e.key?.toLowerCase?.()
          if (k === 'w') input.w = true
          if (k === 'a') input.a = true
          if (k === 's') input.s = true
          if (k === 'd') input.d = true
          if (k === 'shift') input.shift = true
          if (k === 'e') webGameRef.current?.use?.()
          if (k === '1') webGameRef.current?.setWeapon?.('pistol')
          if (k === '2') webGameRef.current?.setWeapon?.('shotgun')
          if (k === 'escape') webGameRef.current?.togglePause?.()
        }
        function onKeyUp(e) {
          const k = e.key?.toLowerCase?.()
          if (k === 'w') input.w = false
          if (k === 'a') input.a = false
          if (k === 's') input.s = false
          if (k === 'd') input.d = false
          if (k === 'shift') input.shift = false
        }

        function requestPointerLock() {
          const el = renderer.domElement
          if (!el?.requestPointerLock) return
          el.requestPointerLock()
        }

        function onPointerLockChange() {
          const locked = document.pointerLockElement === renderer.domElement
          setWebPointerLocked(locked)
        }

        function clamp(v, min, max) {
          return Math.max(min, Math.min(max, v))
        }

        function onMouseMove(e) {
          if (document.pointerLockElement !== renderer.domElement) return
          player.yaw -= e.movementX * 0.0022 * config.lookSpeed
          player.pitch -= e.movementY * 0.0022 * config.lookSpeed
          player.pitch = clamp(player.pitch, -1.25, 1.25)
        }

        const raycaster = new THREE.Raycaster()
        function dealDamage(enemy, amount) {
          enemy.hp -= amount
          enemy.hitFlash = 0.15
          if (enemy.hp <= 0) {
            enemy.alive = false
            enemy.respawn = 2.8
            enemy.mesh.visible = false
            player.score += 1
            setScore(player.score)
            setStatusText('Fragged a ' + enemy.type.label + '!')
            const r = Math.random()
            if (r < 0.22) addPickup('health', worldToCell(enemy.pos.x, enemy.pos.z))
            else if (r < 0.55) addPickup('ammo', worldToCell(enemy.pos.x, enemy.pos.z))
          }
        }

        function shoot() {
          if (player.paused) return
          if (player.health <= 0) return
          if (player.shootCooldown > 0) return

          const weaponDef = WEAPONS[player.weapon] || WEAPONS.pistol
          if (weaponDef.usesShells && player.shells <= 0) {
            setStatusText('Out of shells!')
            return
          }

          player.shootCooldown = weaponDef.cooldown
          if (weaponDef.usesShells) {
            player.shells = Math.max(0, player.shells - 1)
            setShells(player.shells)
          }

          let hitSomething = false
          for (let i = 0; i < weaponDef.pellets; i++) {
            const spreadX = weaponDef.spread ? randRange(-weaponDef.spread, weaponDef.spread) : 0
            const spreadY = weaponDef.spread ? randRange(-weaponDef.spread, weaponDef.spread) : 0
            raycaster.setFromCamera(new THREE.Vector2(spreadX, spreadY), camera)
            const enemyMeshes = enemies.filter((e) => e.alive).map((e) => e.mesh)
            const hit = raycaster.intersectObjects(enemyMeshes, false)[0]
            if (hit && hit.object) {
              const enemy = enemies.find((e) => e.mesh === hit.object)
              if (enemy && enemy.alive) {
                dealDamage(enemy, weaponDef.damage)
                hitSomething = true
              }
            }
          }
          if (!hitSomething) setStatusText('Miss!')
        }

        function use() {
          if (player.paused) return
          if (player.useCooldown > 0) return
          player.useCooldown = 0.25

          if (door.mesh && door.cell) {
            const dp = cellToWorld(door.cell.x, door.cell.z)
            const dx = dp.x - player.pos.x
            const dz = dp.z - player.pos.z
            const dist = Math.sqrt(dx * dx + dz * dz)
            if (dist < 2.0) {
              if (!player.hasKey) {
                setStatusText('Door locked. Find the key.')
                return
              }
              door.opening = true
              setStatusText('Door opening…')
              return
            }
          }

          if (parsed.spawns.exit) {
            const ep = cellToWorld(parsed.spawns.exit.x, parsed.spawns.exit.z)
            const dx = ep.x - player.pos.x
            const dz = ep.z - player.pos.z
            const dist = Math.sqrt(dx * dx + dz * dz)
            if (dist < 2.0) {
              setStatusText('Exit reached! Reset to play again.')
              player.paused = true
              setPaused(true)
            }
          }
        }

        function setWeapon(kind) {
          if (kind !== 'pistol' && kind !== 'shotgun') return
          player.weapon = kind
          setWeapon(kind)
          setStatusText('Weapon: ' + (WEAPONS[kind]?.label || kind))
        }

        function togglePause() {
          player.paused = !player.paused
          setPaused(player.paused)
          setStatusText(player.paused ? 'Paused' : 'Back to it!')
        }

        function reset() {
          player.health = 100
          player.score = 0
          player.shells = 10
          player.hasKey = false
          player.weapon = 'pistol'
          player.shootCooldown = 0
          player.useCooldown = 0
          player.paused = false
          door.open = 0
          door.opening = false

          const p = cellToWorld(spawnPlayerCell.x, spawnPlayerCell.z)
          player.pos.x = p.x
          player.pos.z = p.z
          player.yaw = 0
          player.pitch = 0

          while (pickups.length > 0) {
            const p = pickups.pop()
            scene.remove(p.mesh)
          }
          for (const cell of parsed.spawns.ammo) addPickup('ammo', cell)
          for (const cell of parsed.spawns.health) addPickup('health', cell)
          if (parsed.spawns.key) addPickup('key', parsed.spawns.key)

          for (const e of enemies) {
            e.hp = e.type.hp
            e.cooldown = randRange(e.type.cooldown[0], e.type.cooldown[1])
            e.hitFlash = 0
            e.alive = true
            e.respawn = 0
            const spawn = randChoice(enemySpawns)
            const wp = cellToWorld(spawn.x, spawn.z)
            e.pos.x = wp.x
            e.pos.z = wp.z
            e.mesh.position.set(wp.x, 1.0, wp.z)
            e.mesh.visible = true
          }

          while (projectiles.length > 0) {
            const pr = projectiles.pop()
            scene.remove(pr.mesh)
          }

          setHealth(100)
          setScore(0)
          setShells(10)
          setWeapon('pistol')
          setHasKey(false)
          setPaused(false)
          setStatusText('Find the key. Open the door. Reach the exit.')
        }

        function resize() {
          const rect = host.getBoundingClientRect()
          const w = Math.max(1, Math.floor(rect.width))
          const h = Math.max(1, Math.floor(rect.height))
          renderer.setSize(w, h, false)
          camera.aspect = w / h
          camera.updateProjectionMatrix()
        }

        function step(dt) {
          if (player.paused) return

          if (player.shootCooldown > 0) player.shootCooldown -= dt
          if (player.useCooldown > 0) player.useCooldown -= dt

          if (door.mesh && door.opening && door.open < 1) {
            door.open = Math.min(1, door.open + dt * 0.9)
            door.mesh.position.y = WALL_HEIGHT / 2 + door.open * WALL_HEIGHT
          }

          camera.position.set(player.pos.x, EYE_HEIGHT, player.pos.z)
          camera.rotation.y = player.yaw
          camera.rotation.x = player.pitch

          const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, player.yaw, 0))
          const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, player.yaw, 0))
          const v = new THREE.Vector3(0, 0, 0)
          if (input.w) v.add(forward)
          if (input.s) v.sub(forward)
          if (input.d) v.add(right)
          if (input.a) v.sub(right)
          if (v.lengthSq() > 0) {
            v.normalize().multiplyScalar(config.moveSpeed * (input.shift ? 1.6 : 1) * dt)
            player.pos.x += v.x
            player.pos.z += v.z
            resolveCollisions(player.pos, PLAYER_RADIUS)
          }

          for (let i = pickups.length - 1; i >= 0; i--) {
            const p = pickups[i]
            p.mesh.rotation.y += dt * 1.2
            const dx = p.pos.x - player.pos.x
            const dz = p.pos.z - player.pos.z
            const dist = Math.sqrt(dx * dx + dz * dz)
            if (dist < 1.1) {
              if (p.kind === 'health') {
                player.health = Math.min(100, player.health + 25)
                setHealth(player.health)
                setStatusText('Picked up health!')
              } else if (p.kind === 'ammo') {
                player.shells = Math.min(50, player.shells + 6)
                setShells(player.shells)
                setStatusText('Picked up shells!')
              } else if (p.kind === 'key') {
                player.hasKey = true
                setHasKey(true)
                setStatusText('Got the key!')
              }
              scene.remove(p.mesh)
              pickups.splice(i, 1)
            }
          }

          const enemyMult = config.difficulty
          for (const e of enemies) {
            if (!e.alive) {
              e.respawn -= dt
              if (e.respawn <= 0) {
                e.alive = true
                e.hp = e.type.hp
                e.cooldown = randRange(e.type.cooldown[0], e.type.cooldown[1])
                const spawn = randChoice(enemySpawns)
                const wp = cellToWorld(spawn.x, spawn.z)
                e.pos.x = wp.x
                e.pos.z = wp.z
                e.mesh.position.set(wp.x, 1.0, wp.z)
                e.mesh.visible = true
              }
              continue
            }

            if (e.hitFlash > 0) {
              e.hitFlash -= dt
              e.mesh.material.emissive = new THREE.Color(0x220000)
            } else {
              e.mesh.material.emissive = new THREE.Color(0x000000)
            }

            const dx = player.pos.x - e.pos.x
            const dz = player.pos.z - e.pos.z
            const dist = Math.sqrt(dx * dx + dz * dz)
            const sees = dist < 16 && hasLineOfSight(e.pos.x, e.pos.z, player.pos.x, player.pos.z)

            if (sees && player.health > 0) {
              const dirX = dx / (dist || 1)
              const dirZ = dz / (dist || 1)
              e.pos.x += dirX * e.type.speed * enemyMult * dt
              e.pos.z += dirZ * e.type.speed * enemyMult * dt
              resolveCollisions(e.pos, e.type.radius)
              e.mesh.position.set(e.pos.x, 1.0, e.pos.z)
            }

            e.cooldown -= dt
            if (e.cooldown <= 0 && sees && player.health > 0) {
              if (!e.type.ranged && dist < 1.2) {
                player.health = Math.max(0, player.health - Math.round(e.type.damage * enemyMult))
                setHealth(player.health)
                setStatusText(e.type.label + ' hits you!')
                e.cooldown = randRange(e.type.cooldown[0], e.type.cooldown[1])
              } else if (e.type.ranged && dist < 11) {
                spawnProjectile(e.pos.x, e.pos.z, player.pos.x, player.pos.z, Math.round(e.type.damage * enemyMult), e.type.projectileSpeed)
                e.cooldown = randRange(e.type.cooldown[0], e.type.cooldown[1])
              }
            }
          }

          for (let i = projectiles.length - 1; i >= 0; i--) {
            const pr = projectiles[i]
            pr.life -= dt
            pr.x += pr.vx * dt
            pr.z += pr.vz * dt
            pr.mesh.position.set(pr.x, 1.2, pr.z)

            const dx = pr.x - player.pos.x
            const dz = pr.z - player.pos.z
            const dist = Math.sqrt(dx * dx + dz * dz)
            if (dist < 0.55 && player.health > 0 && !player.paused) {
              player.health = Math.max(0, player.health - pr.damage)
              setHealth(player.health)
              setStatusText('Hit by fireball!')
              scene.remove(pr.mesh)
              projectiles.splice(i, 1)
              continue
            }

            const cell = worldToCell(pr.x, pr.z)
            if (isSolidCell(cell.x, cell.z) || pr.life <= 0) {
              scene.remove(pr.mesh)
              projectiles.splice(i, 1)
            }
          }

          if (parsed.spawns.exit && player.health > 0 && !player.paused) {
            const ep = cellToWorld(parsed.spawns.exit.x, parsed.spawns.exit.z)
            const dx = ep.x - player.pos.x
            const dz = ep.z - player.pos.z
            const dist = Math.sqrt(dx * dx + dz * dz)
            if (dist < 2.2) setStatusText('Exit is here. Press E to finish!')
          }

          if (player.health <= 0 && !player.paused) {
            player.paused = true
            setPaused(true)
            setStatusText('Game over. Reset to try again.')
          }
        }

        function onMouseDown() {
          if (document.pointerLockElement !== renderer.domElement) return
          shoot()
        }

        webGameRef.current = {
          requestPointerLock,
          reset,
          togglePause,
          use,
          setWeapon,
        }

        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
        document.addEventListener('pointerlockchange', onPointerLockChange)
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mousedown', onMouseDown)

        let resizeObserver = null
        if (typeof ResizeObserver !== 'undefined') {
          resizeObserver = new ResizeObserver(() => resize())
          resizeObserver.observe(host)
        } else {
          window.addEventListener('resize', resize)
        }

        resize()
        setStatusText('Click to start (mouse lock). WASD, click to shoot, E use, 1/2 weapons.')

        let raf = 0
        let lastTime = performance.now()
        const tick = (now) => {
          const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000))
          lastTime = now
          resize()
          step(dt)
          renderer.render(scene, camera)
          raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)

        cleanup = () => {
          try {
            if (raf) cancelAnimationFrame(raf)
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('keyup', onKeyUp)
            document.removeEventListener('pointerlockchange', onPointerLockChange)
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mousedown', onMouseDown)
            if (resizeObserver) resizeObserver.disconnect()
            else window.removeEventListener('resize', resize)
            renderer.dispose()
            if (renderer.domElement && renderer.domElement.parentNode === host) host.removeChild(renderer.domElement)
          } catch (e) {}
          webGameRef.current = null
        }
      } catch (e) {
        setStatusText(`Error: ${String(e?.message || e)}`)
      }
    })()

    return () => {
      if (cleanup) cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const SceneHost = useMemo(() => {
    if (Platform.OS === 'web') return null
    return require('react-native-webview').WebView
  }, [])

  const showStartOverlay = Platform.OS === 'web' && webPointerLocked !== true
  const weaponLabel = WEAPONS[weapon]?.label || weapon
  const ammoText = weapon === 'shotgun' ? `Shells ${shells}` : 'Ammo ∞'

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subTitle} numberOfLines={2}>
          Find key → open door → exit. Web: click to lock mouse • WASD • click shoot • E use • 1/2 weapons.
        </Text>
      </View>

      <View style={styles.bar}>
        <Text style={styles.stat}>HP {health}</Text>
        <Text style={styles.stat}>Score {score}</Text>
        <Text style={styles.stat}>{weaponLabel}</Text>
        <Text style={styles.stat}>{ammoText}</Text>
        <Text style={styles.stat}>{hasKey ? 'Key ✓' : 'Key ✕'}</Text>
        <View style={{flex: 1}} />
        <Pressable style={styles.smallButton} onPress={togglePause}>
          <Text style={styles.smallButtonText}>{paused ? 'Resume' : 'Pause'}</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={resetGame}>
          <Text style={styles.smallButtonText}>Reset</Text>
        </Pressable>
      </View>

      <Text style={styles.status} numberOfLines={2}>
        {statusText}
      </Text>

      <View style={styles.scene}>
        {Platform.OS === 'web' ? (
          <View style={styles.webScene}>
            <View ref={canvasHostRef} style={styles.canvasHost} />
            <View pointerEvents="none" style={styles.crosshair} />

            {showStartOverlay ? (
              <Pressable style={styles.startOverlay} onPress={() => webGameRef.current?.requestPointerLock?.()}>
                <View style={styles.startCard}>
                  <Text style={styles.startTitle}>Tap to play</Text>
                  <Text style={styles.startHint}>Pointer lock + mouse look</Text>
                </View>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <SceneHost
            ref={webViewRef}
            originWhitelist={['*']}
            source={{html}}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onMessage={(e) => {
              const msg = safeJsonParse(e?.nativeEvent?.data)
              if (!msg) return
              handleSceneMessage(msg)
            }}
            style={styles.webview}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 4,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  subTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  stat: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '800',
  },
  smallButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  smallButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  status: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  scene: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  webScene: {
    flex: 1,
  },
  canvasHost: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  crosshair: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 16,
    height: 16,
    marginLeft: -8,
    marginTop: -8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
  },
  startOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  startCard: {
    width: '82%',
    maxWidth: 360,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(11,18,32,0.92)',
  },
  startTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  startHint: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '700',
  },
})
