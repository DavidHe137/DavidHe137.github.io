import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const lite = matchMedia("(max-width: 700px), (pointer: coarse)").matches;
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(lite ? 1 : Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.domElement.className = "kitchen";
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#2b1d14");
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.3;

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bokeh = new BokehPass(scene, camera, { focus: 9, aperture: 0.005, maxblur: 0.008 });
bokeh.enabled = !lite;
composer.addPass(bokeh);
const steamScene = new THREE.Scene();
const steamPass = new RenderPass(steamScene, camera);
steamPass.clear = false;
composer.addPass(steamPass);
composer.addPass(new OutputPass());

const canvasTexture = (w, h, draw) => {
	const c = Object.assign(document.createElement("canvas"), { width: w, height: h });
	draw(c.getContext("2d"));
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.SRGBColorSpace;
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	return t;
};

const sphere = new THREE.SphereGeometry(1, 32, 24);
const add = (parent, geo, mat, [x, y, z], [sx, sy, sz] = [1, 1, 1]) => {
	const m = new THREE.Mesh(geo, mat);
	m.position.set(x, y, z);
	m.scale.set(sx, sy, sz);
	m.castShadow = m.receiveShadow = true;
	parent.add(m);
	return m;
};
const mat = (color, roughness = 0.7, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });

const bricks = (w, h, rows, cols, gap, paint) =>
	canvasTexture(w, h, (g) => {
		g.fillStyle = paint ? "#b9ad9c" : "#000";
		g.fillRect(0, 0, w, h);
		const bw = w / cols;
		const bh = h / rows;
		for (let row = 0; row < rows; row++)
			for (let col = -1; col < cols; col++) {
				g.fillStyle = paint ? paint() : "#fff";
				g.fillRect(col * bw + (row % 2) * (bw / 2) + gap, row * bh + gap, bw - gap * 2, bh - gap * 2);
			}
		if (paint)
			for (let i = 0; i < 4000; i++) {
				g.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.15})`;
				g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
			}
	});

const brickColor = bricks(512, 512, 8, 4, 4, () => `hsl(${6 + Math.random() * 12}, ${32 + Math.random() * 15}%, ${22 + Math.random() * 12}%)`);
const brickBump = bricks(512, 512, 8, 4, 4);
const tileColor = bricks(512, 512, 8, 4, 3, () => `hsl(40, 20%, ${92 + Math.random() * 4}%)`);
const tileBump = bricks(512, 512, 8, 4, 3);
for (const t of [brickColor, brickBump]) t.repeat.set(12, 4);
for (const t of [tileColor, tileBump]) t.repeat.set(30, 2);

const wood = (base) =>
	canvasTexture(512, 128, (g) => {
		g.fillStyle = base;
		g.fillRect(0, 0, 512, 128);
		for (let i = 0; i < 160; i++) {
			g.strokeStyle = `rgba(40, 20, 5, ${Math.random() * 0.25})`;
			g.lineWidth = Math.random() * 2;
			const y = Math.random() * 128;
			g.beginPath();
			g.moveTo(0, y);
			g.bezierCurveTo(170, y + Math.random() * 8 - 4, 340, y + Math.random() * 8 - 4, 512, y);
			g.stroke();
		}
	});

const brooklyn = canvasTexture(1024, 880, (g) => {
	const sky = g.createLinearGradient(0, 0, 0, 880);
	sky.addColorStop(0, "#3b4a7a");
	sky.addColorStop(0.45, "#c9708a");
	sky.addColorStop(0.75, "#f6a25e");
	sky.addColorStop(1, "#ffd59a");
	g.fillStyle = sky;
	g.fillRect(0, 0, 1024, 880);
	g.fillStyle = "rgba(255, 240, 210, 0.9)";
	g.beginPath();
	g.arc(720, 560, 60, 0, Math.PI * 2);
	g.fill();
	g.fillStyle = "#6a5577";
	for (let x = 0; x < 1024; x += 26 + Math.random() * 30) {
		const h = 120 + Math.random() * 260;
		g.fillRect(x, 640 - h, 20 + Math.random() * 30, h + 240);
	}
	g.fillStyle = "#4a3346";
	g.fillRect(0, 610, 1024, 12);
	for (let x = 60; x < 1024; x += 90) g.fillRect(x, 560, 8, 60);
	g.fillStyle = "#2a1c26";
	for (let x = -20; x < 1024; x += 150 + Math.random() * 60) {
		const top = 640 + Math.random() * 60;
		g.fillRect(x, top, 140, 880 - top);
		g.fillStyle = "#ffcf7a";
		for (let wx = x + 14; wx < x + 130; wx += 32)
			for (let wy = top + 30; wy < 880; wy += 50) if (Math.random() < 0.45) g.fillRect(wx, wy, 14, 22);
		g.fillStyle = "#2a1c26";
		if (Math.random() < 0.6) {
			const tx = x + 40 + Math.random() * 50;
			g.fillRect(tx, top - 70, 4, 70);
			g.fillRect(tx + 36, top - 70, 4, 70);
			g.fillRect(tx - 6, top - 120, 52, 55);
			g.beginPath();
			g.moveTo(tx - 10, top - 120);
			g.lineTo(tx + 20, top - 150);
			g.lineTo(tx + 50, top - 120);
			g.fill();
		}
	}
});

const glow = canvasTexture(64, 64, (g) => {
	const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
	r.addColorStop(0, "rgba(255,255,255,1)");
	r.addColorStop(1, "rgba(255,255,255,0)");
	g.fillStyle = r;
	g.fillRect(0, 0, 64, 64);
});

add(scene, new THREE.PlaneGeometry(40, 8), mat("#ffffff", 0.85, { map: brickColor, bumpMap: brickBump, bumpScale: 3 }), [0, 5.3, -1.6]);
add(scene, new THREE.PlaneGeometry(40, 1.3), mat("#ffffff", 0.25, { map: tileColor, bumpMap: tileBump, bumpScale: 1.5 }), [0, 0.65, -1.59]);
add(scene, new THREE.BoxGeometry(40, 0.2, 3.4), mat("#ffffff", 0.55, { map: wood("#a8723f") }), [0, -0.1, 0.05]);
add(scene, new THREE.BoxGeometry(40, 4, 3), mat("#1f2a24", 0.75), [0, -2.2, -0.05]);
for (let x = -9; x <= 9; x += 1.8) {
	add(scene, new THREE.BoxGeometry(1.7, 1.7, 0.05), mat("#26332c", 0.7), [x, -1.2, 1.47]);
	add(scene, new THREE.CylinderGeometry(0.025, 0.025, 0.7), mat("#c9a14a", 0.25, { metalness: 1 }), [x, -0.55, 1.55]).rotation.z = Math.PI / 2;
}

const steel = mat("#151515", 0.5, { metalness: 0.7 });
add(scene, new THREE.PlaneGeometry(3.2, 2.8), new THREE.MeshBasicMaterial({ map: brooklyn }), [-4.6, 3.0, -1.58]);
for (const x of [-6.2, -5.4, -4.6, -3.8, -3.0]) add(scene, new THREE.BoxGeometry(0.07, 2.9, 0.08), steel, [x, 3.0, -1.54]);
for (const y of [1.6, 2.53, 3.47, 4.4]) add(scene, new THREE.BoxGeometry(3.3, 0.07, 0.08), steel, [-4.6, y, -1.54]);
add(scene, new THREE.BoxGeometry(3.5, 0.08, 0.35), mat("#ffffff", 0.6, { map: wood("#8a5a30") }), [-4.6, 1.56, -1.42]);

const terracotta = mat("#b8673f", 0.85);
const leaf = mat("#2f6b3a", 0.55, { side: THREE.DoubleSide });
const pothos = mat("#5c9a3a", 0.5);
for (const x of [-5.6, -4.9, -4.2]) {
	add(scene, new THREE.CylinderGeometry(0.13, 0.1, 0.2, 20), terracotta, [x, 1.7, -1.4]);
	for (let i = 0; i < 6; i++) add(scene, sphere, i % 2 ? leaf : pothos, [x + Math.cos(i) * 0.08, 1.88 + (i % 3) * 0.04, -1.4 + Math.sin(i) * 0.08], [0.07, 0.05, 0.07]);
}

add(scene, new THREE.CylinderGeometry(0.32, 0.25, 0.55, 24), terracotta, [-6.3, 0.27, -0.9]);
for (let i = 0; i < 9; i++) {
	const a = (i / 9) * Math.PI * 2;
	const h = 0.9 + (i % 3) * 0.35;
	const stem = add(scene, new THREE.CylinderGeometry(0.015, 0.015, h), mat("#3f6b2c"), [-6.3 + Math.cos(a) * 0.15, 0.5 + h / 2, -0.9 + Math.sin(a) * 0.15]);
	stem.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35);
	const l = add(scene, sphere, leaf, [-6.3 + Math.cos(a) * (0.2 + h * 0.35), 0.5 + h, -0.9 + Math.sin(a) * (0.2 + h * 0.35)], [0.32, 0.02, 0.24]);
	l.rotation.set(Math.sin(a) * 0.5, -a, -Math.cos(a) * 0.5);
}

const shelfWood = mat("#ffffff", 0.6, { map: wood("#9a6a3c") });
const glass = new THREE.MeshPhysicalMaterial({ color: "#dfeee8", roughness: 0.05, transparent: true, opacity: 0.35, clearcoat: 1 });
for (const y of [1.9, 2.8]) {
	add(scene, new THREE.BoxGeometry(3.2, 0.08, 0.5), shelfWood, [5.6, y, -1.33]);
	for (const x of [4.3, 6.9]) add(scene, new THREE.BoxGeometry(0.04, 0.3, 0.4), steel, [x, y - 0.18, -1.38]);
}
[["#e8c55a", 4.4], ["#7a4a2a", 4.8], ["#f2ece0", 5.2], ["#c94a2a", 5.55]].forEach(([fill, x]) => {
	add(scene, new THREE.CylinderGeometry(0.14, 0.14, 0.36, 24), glass, [x, 2.12, -1.3]);
	add(scene, new THREE.CylinderGeometry(0.12, 0.12, 0.22, 24), mat(fill, 0.9), [x, 2.06, -1.3]);
	add(scene, new THREE.CylinderGeometry(0.145, 0.145, 0.05, 24), mat("#b8b8b8", 0.3, { metalness: 1 }), [x, 2.32, -1.3]);
});
for (const [x, h] of [[6.0, 0.55], [6.25, 0.45], [6.45, 0.6], [6.7, 0.5]]) add(scene, new THREE.BoxGeometry(0.15, h, 0.38), mat(["#2f4f6f", "#8a2f2f", "#c79a3a", "#3f5f3f"][Math.round(x * 4) % 4], 0.8), [x, 1.94 + h / 2, -1.33]);
add(scene, new THREE.CylinderGeometry(0.2, 0.16, 0.3, 20), terracotta, [5.0, 2.99, -1.3]);
for (let i = 0; i < 5; i++) {
	const vine = new THREE.CatmullRomCurve3(
		Array.from({ length: 6 }, (_, k) => new THREE.Vector3(5.0 + (i - 2) * 0.08 + Math.sin(k + i) * 0.1, 3.0 - k * (0.25 + i * 0.05), -1.15 + Math.cos(k) * 0.05)),
	);
	add(scene, new THREE.TubeGeometry(vine, 24, 0.01, 6), mat("#3f6b2c"), [0, 0, 0]);
	for (let k = 0; k < 10; k++) {
		const p = vine.getPoint(k / 10);
		add(scene, sphere, pothos, [p.x, p.y, p.z + 0.03], [0.06, 0.045, 0.02]).rotation.z = k;
	}
}

const bulbs = [-1.8, 0.4, 2.5].map((x) => {
	const pendant = new THREE.Group();
	pendant.position.set(x, 6, -0.3);
	scene.add(pendant);
	add(pendant, new THREE.CylinderGeometry(0.01, 0.01, 3), mat("#111"), [0, -1.5, 0]);
	add(pendant, new THREE.CylinderGeometry(0.06, 0.06, 0.14, 16), mat("#b08a4a", 0.3, { metalness: 1 }), [0, -3.05, 0]);
	add(pendant, sphere, new THREE.MeshStandardMaterial({ color: "#ffd9a0", emissive: "#ffae4a", emissiveIntensity: 4 }), [0, -3.25, 0], [0.1, 0.14, 0.1]).castShadow = false;
	const light = new THREE.PointLight("#ffb366", 4, 6, 2);
	light.position.y = -3.3;
	pendant.add(light);
	return pendant;
});

add(scene, new THREE.BoxGeometry(1.9, 0.1, 1.4), mat("#1e1e1e", 0.4, { metalness: 0.6 }), [2.6, 0.05, 0.1]);
add(scene, new THREE.TorusGeometry(0.4, 0.025, 8, 32), mat("#111", 0.5), [2.6, 0.12, 0.1]).rotation.x = Math.PI / 2;
const flames = [];
for (let i = 0; i < 10; i++) {
	const a = (i / 10) * Math.PI * 2;
	const f = add(scene, new THREE.ConeGeometry(0.035, 0.14, 8), new THREE.MeshBasicMaterial({ color: "#6fb7ff", transparent: true, opacity: 0.85 }), [2.6 + Math.cos(a) * 0.3, 0.17, 0.1 + Math.sin(a) * 0.3]);
	f.castShadow = false;
	flames.push(f);
}
const stoveLight = new THREE.PointLight("#ff9a3c", 2, 3, 2);
stoveLight.position.set(2.6, 0.3, 0.6);
scene.add(stoveLight);

const copper = mat("#c47a43", 0.3, { metalness: 1 });
const pot = new THREE.Group();
pot.position.set(2.6, 0.22, 0.1);
scene.add(pot);
add(pot, new THREE.CylinderGeometry(0.55, 0.5, 0.5, 48, 1, true), copper.clone(), [0, 0.25, 0]).material.side = THREE.DoubleSide;
add(pot, new THREE.CircleGeometry(0.5, 48), copper, [0, 0, 0]).rotation.x = Math.PI / 2;
add(pot, new THREE.TorusGeometry(0.55, 0.03, 12, 48), copper, [0, 0.5, 0]).rotation.x = Math.PI / 2;
add(pot, new THREE.CircleGeometry(0.53, 48), mat("#b8361f", 0.25), [0, 0.4, 0]).rotation.x = -Math.PI / 2;
for (const s of [-1, 1]) add(pot, new THREE.TorusGeometry(0.1, 0.025, 8, 16), copper, [s * 0.6, 0.38, 0]).rotation.y = Math.PI / 2;

const steam = Array.from({ length: 8 }, () => {
	const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: "#fff4e6", transparent: true, depthWrite: false }));
	steamScene.add(s);
	return s;
});

add(scene, new THREE.BoxGeometry(1.5, 0.08, 0.9), mat("#ffffff", 0.6, { map: wood("#c79a62") }), [-2.4, 0.04, 0.55]);
add(scene, new THREE.CapsuleGeometry(0.09, 0.55, 8, 16), mat("#3f7a2c", 0.45), [-2.75, 0.17, 0.5]).rotation.z = Math.PI / 2 - 0.2;
add(scene, sphere, mat("#4a2350", 0.3), [-1.95, 0.2, 0.75], [0.13, 0.12, 0.2]);
add(scene, sphere, mat("#c9302c", 0.3), [-1.8, 0.18, 0.4], [0.12, 0.11, 0.12]);
add(scene, new THREE.CylinderGeometry(0.02, 0.02, 0.05), mat("#3f7a2c"), [-1.8, 0.3, 0.4]);

add(scene, new THREE.CylinderGeometry(0.6, 0.5, 0.05, 48), mat("#f6f1e6", 0.3), [0.2, 0.03, 1.1]);
const sliceColors = ["#c9302c", "#4a8a2e", "#e0b13a", "#5a2a60"];
const slice = new THREE.CylinderGeometry(0.075, 0.075, 0.012, 20);
let n = 0;
for (const r of [0.1, 0.22, 0.34, 0.45])
	for (let a = 0; a < Math.PI * 2; a += 0.06 / r) {
		const s = add(scene, slice, mat(sliceColors[n++ % 4], 0.35), [0.2 + Math.cos(a) * r, 0.11, 1.1 + Math.sin(a) * r]);
		s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-Math.sin(a), 0.7, Math.cos(a)).normalize());
	}

add(scene, new THREE.CylinderGeometry(0.22, 0.2, 0.06, 32), mat("#f2efe8", 0.3), [4.3, 0.03, 0.6]);
add(scene, new THREE.CylinderGeometry(0.13, 0.1, 0.24, 32), mat("#f2efe8", 0.3), [4.3, 0.18, 0.6]);
add(scene, new THREE.TorusGeometry(0.06, 0.018, 8, 16), mat("#f2efe8", 0.3), [4.45, 0.19, 0.6]);

const pink = mat("#e3a3ad", 0.6);
const belly = new THREE.MeshPhysicalMaterial({ color: "#ddd6df", roughness: 0.9, sheen: 1, sheenRoughness: 0.4, sheenColor: "#ffffff" });
const eyeMat = new THREE.MeshPhysicalMaterial({ color: "#0d0d10", roughness: 0.05, clearcoat: 1 });
const sparkle = new THREE.MeshBasicMaterial({ color: "#ffffff" });
const tooth = mat("#fffaf0", 0.3);
const blush = mat("#f08a9a", 0.8, { transparent: true, opacity: 0.55 });
const whiskerMat = new THREE.LineBasicMaterial({ color: "#2a2a2a" });

const makeRat = (color) => {
	const fur = new THREE.MeshPhysicalMaterial({ color, roughness: 0.9, sheen: 1, sheenRoughness: 0.35, sheenColor: new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.6) });
	const brow = mat(new THREE.Color(color).multiplyScalar(0.55), 0.9);
	const rat = new THREE.Group();
	add(rat, sphere, fur, [0, 0.45, 0], [0.32, 0.42, 0.3]);
	add(rat, sphere, belly, [0, 0.42, 0.12], [0.22, 0.3, 0.2]);
	for (const s of [-1, 1]) add(rat, sphere, pink, [s * 0.14, 0.04, 0.14], [0.09, 0.05, 0.15]);
	const tail = new THREE.CatmullRomCurve3([[0, 0.2, -0.25], [0, 0.06, -0.6], [0.25, 0.05, -0.85], [0.45, 0.2, -0.8], [0.4, 0.35, -0.65]].map((p) => new THREE.Vector3(...p)));
	add(rat, new THREE.TubeGeometry(tail, 32, 0.035, 8), pink, [0, 0, 0]);

	const head = new THREE.Group();
	head.position.y = 0.82;
	rat.add(head);
	add(head, sphere, fur, [0, 0.12, 0], [0.26, 0.24, 0.24]);
	for (const s of [-1, 1]) add(head, sphere, fur, [s * 0.1, 0.04, 0.15], [0.12, 0.1, 0.12]);
	add(head, sphere, fur, [0, 0.05, 0.24], [0.12, 0.1, 0.19]);
	const nose = add(head, sphere, mat("#d9707f", 0.4), [0, 0.08, 0.42], [0.05, 0.04, 0.04]);
	add(head, new THREE.BoxGeometry(0.05, 0.05, 0.02), tooth, [0, -0.04, 0.34]);
	const eyes = [-1, 1].map((s) => {
		const eye = add(head, sphere, eyeMat, [s * 0.1, 0.19, 0.19], [0.06, 0.075, 0.05]);
		add(eye, sphere, sparkle, [0.35, 0.4, 0.8], [0.28, 0.28, 0.28]).castShadow = false;
		return eye;
	});
	const brows = [-1, 1].map((s) => {
		const b = add(head, new THREE.TorusGeometry(0.05, 0.011, 8, 16, 1.8), brow, [s * 0.1, 0.27, 0.205]);
		b.rotation.z = (Math.PI - 1.8) / 2;
		return b;
	});
	for (const s of [-1, 1]) {
		add(head, sphere, fur, [s * 0.2, 0.36, -0.04], [0.15, 0.15, 0.035]).rotation.z = s * -0.3;
		add(head, sphere, pink, [s * 0.2, 0.36, -0.005], [0.1, 0.1, 0.02]).rotation.z = s * -0.3;
		add(head, sphere, blush, [s * 0.17, 0.07, 0.21], [0.05, 0.03, 0.02]).castShadow = false;
	}
	const whiskers = [-1, 1].flatMap((s) => [s * 0.08, 0.07, 0.34, s * 0.4, 0.12, 0.3, s * 0.08, 0.06, 0.34, s * 0.4, 0.0, 0.32]);
	head.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(whiskers, 3)), whiskerMat));

	const arms = [-1, 1].map((s) => {
		const pivot = new THREE.Group();
		pivot.position.set(s * 0.27, 0.62, 0.05);
		rat.add(pivot);
		add(pivot, sphere, fur, [0, -0.15, 0], [0.07, 0.17, 0.07]);
		add(pivot, sphere, pink, [0, -0.31, 0], [0.065, 0.055, 0.065]);
		for (const f of [-1, 0, 1]) add(pivot, sphere, pink, [f * 0.035, -0.36, 0.025], [0.022, 0.03, 0.022]);
		return pivot;
	});
	scene.add(rat);
	return { rat, head, eyes, brows, nose, arms, jumpAt: -10, hop: 0 };
};

const chef = makeRat("#6f7a8f");
chef.rat.position.set(1.6, 0.38, 0.3);
chef.rat.rotation.y = 1.35;
add(scene, new THREE.BoxGeometry(0.9, 0.2, 0.65), mat("#7a2a2a", 0.6), [1.6, 0.1, 0.3]);
add(scene, new THREE.BoxGeometry(0.8, 0.18, 0.6), mat("#2f5a4a", 0.6), [1.6, 0.29, 0.3]).rotation.y = 0.15;
const hat = new THREE.Group();
chef.head.add(hat);
add(hat, new THREE.CylinderGeometry(0.17, 0.15, 0.22, 32), mat("#ffffff", 0.8), [0, 0.42, -0.02]);
add(hat, sphere, mat("#ffffff", 0.8), [0, 0.58, -0.02], [0.24, 0.14, 0.22]);
add(chef.arms[0], new THREE.CylinderGeometry(0.02, 0.02, 0.8), mat("#a0703c", 0.6), [0, -0.65, 0]);
add(chef.arms[0], sphere, mat("#a0703c", 0.6), [0, -1.05, 0], [0.06, 0.04, 0.08]);

const sous = makeRat("#8a8178");
sous.rat.position.set(-2.4, 0, -0.35);
add(sous.rat, new THREE.TorusGeometry(0.2, 0.05, 12, 32), mat("#b0302a", 0.8), [0, 0.8, 0]).rotation.x = Math.PI / 2;
add(sous.arms[0], new THREE.CylinderGeometry(0.025, 0.025, 0.16), mat("#3a2412", 0.5), [0, -0.38, 0]);
add(sous.arms[0], new THREE.BoxGeometry(0.012, 0.42, 0.11), mat("#d8dde2", 0.2, { metalness: 1 }), [0, -0.66, -0.03]);

const taster = makeRat("#7c7f8c");
taster.rat.position.set(-0.6, 0, -0.5);
taster.rat.rotation.y = 0.3;
add(taster.rat, new THREE.CapsuleGeometry(0.075, 0.95, 8, 16), mat("#d39a4c", 0.75), [0.05, 0.55, 0.3]).rotation.z = 0.9;
for (const a of taster.arms) a.rotation.x = -0.7;

const runner = makeRat("#6b6560");
runner.rat.scale.setScalar(0.5);
const wedge = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.5, 0), new THREE.Vector2(0, 0.3)]);
add(runner.head, new THREE.ExtrudeGeometry(wedge, { depth: 0.35, bevelEnabled: false }), mat("#f2c94c", 0.5), [-0.25, 0.35, -0.17]);

const rats = [chef, sous, taster, runner];

scene.add(new THREE.HemisphereLight("#ffe2c0", "#2a1810", 0.45));
const sun = new THREE.DirectionalLight("#ffc98a", 1.8);
sun.position.set(-3, 7, 6);
sun.castShadow = true;
sun.shadow.mapSize.setScalar(lite ? 1024 : 2048);
sun.shadow.bias = -0.0005;
Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 6, bottom: -4 });
scene.add(sun);
const windowLight = new THREE.PointLight("#ff9f6a", 4, 6, 2);
windowLight.position.set(-4.6, 2.8, -0.8);
scene.add(windowLight);

const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const ratAt = (e) => {
	raycaster.setFromCamera(new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, 1 - (e.clientY / innerHeight) * 2), camera);
	const hit = raycaster.intersectObjects(rats.map((r) => r.rat))[0];
	return hit && rats.find((r) => r.rat.getObjectById(hit.object.id));
};
addEventListener("pointermove", (e) => {
	pointer.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
	document.body.style.cursor = !e.target.closest("a, .ticket, .chalkboard") && ratAt(e) ? "pointer" : "";
});
addEventListener("pointerdown", (e) => {
	const rat = !e.target.closest("a, .ticket, .chalkboard") && ratAt(e);
	if (rat) rat.jumpAt = clock.getElapsedTime();
});

const resize = () => {
	renderer.setSize(innerWidth, innerHeight);
	composer.setSize(innerWidth, innerHeight);
	camera.aspect = innerWidth / innerHeight;
	camera.updateProjectionMatrix();
};
addEventListener("resize", resize);
resize();

const clock = new THREE.Clock();
const focus = new THREE.Vector3(0, 0.8, 0.3);

renderer.setAnimationLoop(() => {
	const t = still ? 0 : clock.getElapsedTime();
	const scroll = scrollY / innerHeight;
	camera.position.set(pointer.x * 0.4, 2.4 + scroll * 2.2 - pointer.y * 0.2, 8.5 / Math.min(camera.aspect, 1.3));
	camera.lookAt(0, 1.1 + scroll * 2.4, 0);
	bokeh.uniforms.focus.value = camera.position.distanceTo(focus);

	for (const r of rats) {
		const j = t - r.jumpAt;
		r.hop = j < 0.6 ? Math.sin((j / 0.6) * Math.PI) : 0;
		for (const b of r.brows) b.position.y = 0.27 + r.hop * 0.05;
		r.nose.scale.x = 0.05 + Math.sin(t * 20 + r.rat.id) * 0.005;
	}

	const sniff = Math.max(0, Math.sin(t * 0.7)) ** 8;
	chef.arms[0].rotation.set(-1.15 + Math.sin(t * 3) * 0.12 * (1 - sniff), 0, Math.cos(t * 3) * 0.25 * (1 - sniff));
	chef.rat.position.y = 0.38 + Math.abs(Math.sin(t * 3)) * 0.02 + chef.hop * 0.3;
	hat.position.y = chef.hop * 0.25;
	hat.rotation.z = chef.hop * 0.6;
	sous.arms[0].rotation.x = -1.5 + Math.abs(Math.sin(t * 6)) * 0.5;
	sous.rat.position.y = sous.hop * 0.3;
	taster.rat.rotation.z = Math.sin(t * 1.5) * 0.05;
	taster.rat.position.y = taster.hop * 0.3;

	const c = (t * 1.1) % 20;
	const paused = c > 7 && c < 10;
	const x = c < 7 ? -10 + (c / 7) * 8.9 : paused ? -1.1 : c < 17 ? -1.1 + ((c - 10) / 7) * 11.1 : 10;
	runner.rat.position.set(x, (paused ? 0 : Math.abs(Math.sin(t * 16)) * 0.05) + runner.hop * 0.2, 1.45);
	runner.rat.rotation.y = THREE.MathUtils.lerp(runner.rat.rotation.y, paused ? 0 : Math.PI / 2, 0.1);
	runner.arms.forEach((a, i) => (a.rotation.x = paused ? -0.3 : Math.sin(t * 16 + i * Math.PI) * 0.8));

	for (const r of rats) {
		const sniffing = r === chef && sniff > 0.3;
		r.head.rotation.y = THREE.MathUtils.lerp(r.head.rotation.y, sniffing ? 0 : pointer.x * 0.5, 0.05);
		r.head.rotation.x = THREE.MathUtils.lerp(r.head.rotation.x, sniffing ? 0.45 : pointer.y * 0.25, 0.05);
		const blink = sniffing || (t + r.rat.id) % 4 < 0.12 ? 0.1 : 1;
		for (const e of r.eyes) e.scale.y = 0.075 * blink;
	}

	bulbs.forEach((b, i) => (b.rotation.z = Math.sin(t * 0.8 + i) * 0.015));
	for (const f of flames) f.scale.y = 0.8 + Math.random() * 0.4;
	stoveLight.intensity = 1.8 + Math.random() * 0.4;
	steam.forEach((s, i) => {
		const p = (t * 0.25 + i / steam.length) % 1;
		s.position.set(2.6 + Math.sin(p * 6 + i) * 0.15, 0.75 + p * 1.6, 0.1);
		s.scale.setScalar(0.25 + p * 0.6);
		s.material.opacity = Math.sin(p * Math.PI) * 0.35;
	});

	composer.render();
});
