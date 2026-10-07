import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.domElement.className = "kitchen";
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#2b1d14");
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);

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

const tiles = canvasTexture(512, 512, (g) => {
	g.fillStyle = "#cdbb98";
	g.fillRect(0, 0, 512, 512);
	for (let row = 0; row < 8; row++)
		for (let col = -1; col < 4; col++) {
			const l = 88 + Math.random() * 5;
			g.fillStyle = `hsl(40, 45%, ${l}%)`;
			g.fillRect(col * 128 + (row % 2) * 64 + 3, row * 64 + 3, 122, 58);
		}
});
tiles.repeat.set(24, 12);

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

const paris = canvasTexture(512, 400, (g) => {
	const sky = g.createLinearGradient(0, 0, 0, 400);
	sky.addColorStop(0, "#1b2a55");
	sky.addColorStop(0.6, "#7a4a7a");
	sky.addColorStop(1, "#f4a261");
	g.fillStyle = sky;
	g.fillRect(0, 0, 512, 400);
	g.fillStyle = "#fff8e0";
	for (let i = 0; i < 60; i++) g.fillRect(Math.random() * 512, Math.random() * 200, 2, 2);
	g.fillStyle = "#1a1424";
	g.beginPath();
	g.moveTo(300, 400);
	g.lineTo(345, 250);
	g.lineTo(358, 120);
	g.lineTo(362, 40);
	g.lineTo(366, 120);
	g.lineTo(379, 250);
	g.lineTo(424, 400);
	g.fill();
	for (let x = 0; x < 512; x += 40) g.fillRect(x, 330 + Math.random() * 40, 38, 80);
	g.fillStyle = "#ffcf70";
	for (let i = 0; i < 30; i++) g.fillRect(Math.random() * 512, 345 + Math.random() * 50, 4, 5);
});

const glow = canvasTexture(64, 64, (g) => {
	const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
	r.addColorStop(0, "rgba(255,255,255,1)");
	r.addColorStop(1, "rgba(255,255,255,0)");
	g.fillStyle = r;
	g.fillRect(0, 0, 64, 64);
});

add(scene, new THREE.PlaneGeometry(40, 16), mat("#ffffff", 0.5, { map: tiles }), [0, 4, -1.6]);
add(scene, new THREE.BoxGeometry(40, 0.2, 3.4), mat("#ffffff", 0.55, { map: wood("#9a6534") }), [0, -0.1, 0.05]);
add(scene, new THREE.BoxGeometry(40, 4, 3), mat("#2f4a3a", 0.6), [0, -2.2, -0.05]);
for (let x = -9; x <= 9; x += 1.8) {
	add(scene, new THREE.BoxGeometry(1.6, 1.6, 0.06), mat("#35553f", 0.55), [x, -1.2, 1.47]);
	add(scene, sphere, mat("#c9a14a", 0.25, { metalness: 1 }), [x + 0.6, -0.55, 1.53], [0.05, 0.05, 0.05]);
}

const frameMat = mat("#5b3a1f", 0.5);
add(scene, new THREE.PlaneGeometry(2.4, 1.9), new THREE.MeshBasicMaterial({ map: paris }), [-4.2, 2.6, -1.58]);
for (const [x, y, w, h] of [[-4.2, 3.6, 2.6, 0.12], [-4.2, 1.6, 2.6, 0.12], [-5.45, 2.6, 0.12, 2.1], [-2.95, 2.6, 0.12, 2.1], [-4.2, 2.6, 0.06, 1.9], [-4.2, 2.6, 2.4, 0.06]])
	add(scene, new THREE.BoxGeometry(w, h, 0.1), frameMat, [x, y, -1.55]);
add(scene, new THREE.BoxGeometry(2.8, 0.1, 0.4), frameMat, [-4.2, 1.5, -1.4]);

const copper = mat("#c47a43", 0.3, { metalness: 1 });
add(scene, new THREE.CylinderGeometry(0.025, 0.025, 4), mat("#3a3a3a", 0.4, { metalness: 1 }), [4.5, 3.1, -1.45]).rotation.z = Math.PI / 2;
for (const [x, r] of [[3, 0.42], [4, 0.34], [4.85, 0.28], [5.6, 0.36]]) {
	const pan = add(scene, new THREE.CylinderGeometry(r, r * 0.85, 0.08, 40), copper, [x, 3.0 - r * 2.2, -1.5]);
	pan.rotation.x = Math.PI / 2;
	add(scene, new THREE.BoxGeometry(0.06, r * 1.4, 0.03), copper, [x, 3.0 - r * 0.55, -1.48]);
}

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
	scene.add(s);
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

const fur = (color) => mat(color, 0.9);
const pink = mat("#e3a3ad", 0.6);
const belly = mat("#d6d0da", 0.9);
const eyeMat = mat("#111111", 0.1);
const whiskerMat = new THREE.LineBasicMaterial({ color: "#2a2a2a" });

const makeRat = (color) => {
	const body = fur(color);
	const rat = new THREE.Group();
	add(rat, sphere, body, [0, 0.45, 0], [0.32, 0.42, 0.3]);
	add(rat, sphere, belly, [0, 0.42, 0.12], [0.22, 0.3, 0.2]);
	for (const s of [-1, 1]) add(rat, sphere, pink, [s * 0.14, 0.04, 0.14], [0.09, 0.05, 0.14]);
	const tail = new THREE.CatmullRomCurve3([[0, 0.2, -0.25], [0, 0.06, -0.6], [0.25, 0.05, -0.85], [0.45, 0.2, -0.8], [0.4, 0.35, -0.65]].map((p) => new THREE.Vector3(...p)));
	add(rat, new THREE.TubeGeometry(tail, 32, 0.035, 8), pink, [0, 0, 0]);

	const head = new THREE.Group();
	head.position.y = 0.82;
	rat.add(head);
	add(head, sphere, body, [0, 0.12, 0], [0.25, 0.23, 0.24]);
	add(head, sphere, body, [0, 0.06, 0.22], [0.13, 0.11, 0.2]);
	add(head, sphere, pink, [0, 0.09, 0.41], [0.045, 0.04, 0.04]);
	const eyes = [-1, 1].map((s) => add(head, sphere, eyeMat, [s * 0.1, 0.18, 0.18], [0.045, 0.055, 0.04]));
	for (const s of [-1, 1]) {
		add(head, sphere, body, [s * 0.19, 0.33, -0.03], [0.13, 0.13, 0.04]);
		add(head, sphere, pink, [s * 0.19, 0.33, 0.0], [0.09, 0.09, 0.02]);
	}
	const whiskers = [-1, 1].flatMap((s) => [s * 0.08, 0.07, 0.34, s * 0.4, 0.12, 0.3, s * 0.08, 0.06, 0.34, s * 0.4, 0.0, 0.32]);
	head.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(whiskers, 3)), whiskerMat));

	const arms = [-1, 1].map((s) => {
		const pivot = new THREE.Group();
		pivot.position.set(s * 0.27, 0.62, 0.05);
		rat.add(pivot);
		add(pivot, sphere, body, [0, -0.15, 0], [0.07, 0.17, 0.07]);
		add(pivot, sphere, pink, [0, -0.31, 0], [0.06, 0.05, 0.06]);
		return pivot;
	});
	scene.add(rat);
	return { rat, head, eyes, arms };
};

const chef = makeRat("#6f7a8f");
chef.rat.position.set(1.6, 0.38, 0.3);
chef.rat.rotation.y = 1.35;
add(scene, new THREE.BoxGeometry(0.9, 0.2, 0.65), mat("#7a2a2a", 0.6), [1.6, 0.1, 0.3]);
add(scene, new THREE.BoxGeometry(0.8, 0.18, 0.6), mat("#2f5a4a", 0.6), [1.6, 0.29, 0.3]).rotation.y = 0.15;
add(chef.head, new THREE.CylinderGeometry(0.17, 0.15, 0.22, 32), mat("#ffffff", 0.8), [0, 0.42, -0.02]);
add(chef.head, sphere, mat("#ffffff", 0.8), [0, 0.58, -0.02], [0.24, 0.14, 0.22]);
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
const baguette = add(taster.rat, new THREE.CapsuleGeometry(0.075, 0.95, 8, 16), mat("#d39a4c", 0.75), [0.05, 0.55, 0.3]);
baguette.rotation.z = 0.9;
for (const a of taster.arms) a.rotation.x = -0.7;

const runner = makeRat("#6b6560");
runner.rat.scale.setScalar(0.5);
runner.rat.rotation.y = Math.PI / 2;
const wedge = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.5, 0), new THREE.Vector2(0, 0.3)]);
add(runner.head, new THREE.ExtrudeGeometry(wedge, { depth: 0.35, bevelEnabled: false }), mat("#f2c94c", 0.5), [-0.25, 0.35, -0.17]);

const rats = [chef, sous, taster, runner];

scene.add(new THREE.HemisphereLight("#fff1dc", "#4a3020", 0.9));
const sun = new THREE.DirectionalLight("#ffe0b5", 2.6);
sun.position.set(3, 7, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0005;
Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 6, bottom: -4 });
scene.add(sun);
const windowLight = new THREE.PointLight("#8fa8ff", 3, 6, 2);
windowLight.position.set(-4.2, 2.4, -0.6);
scene.add(windowLight);

const pointer = new THREE.Vector2();
addEventListener("pointermove", (e) => pointer.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1));

const resize = () => {
	renderer.setSize(innerWidth, innerHeight);
	camera.aspect = innerWidth / innerHeight;
	camera.updateProjectionMatrix();
};
addEventListener("resize", resize);
resize();

const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
	const t = still ? 0 : clock.getElapsedTime();
	const scroll = scrollY / innerHeight;
	const distance = 8.5 / Math.min(camera.aspect, 1.3);
	camera.position.set(pointer.x * 0.4, 2.4 + scroll * 2.2 - pointer.y * 0.2, distance);
	camera.lookAt(0, 1.1 + scroll * 2.4, 0);

	chef.arms[0].rotation.set(-1.15 + Math.sin(t * 3) * 0.12, 0, Math.cos(t * 3) * 0.25);
	chef.rat.position.y = 0.38 + Math.abs(Math.sin(t * 3)) * 0.02;
	sous.arms[0].rotation.x = -1.5 + Math.abs(Math.sin(t * 6)) * 0.5;
	taster.rat.rotation.z = Math.sin(t * 1.5) * 0.05;

	const run = (t * 1.3) % 20;
	runner.rat.position.set(run - 10, Math.abs(Math.sin(t * 16)) * 0.05, 1.25);
	runner.arms.forEach((a, i) => (a.rotation.x = Math.sin(t * 16 + i * Math.PI) * 0.8));

	for (const { head, eyes } of rats) {
		head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, pointer.x * 0.5, 0.05);
		head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, pointer.y * 0.25, 0.05);
		const blink = (t + head.id) % 4 < 0.12 ? 0.1 : 1;
		for (const e of eyes) e.scale.y = 0.055 * blink;
	}

	for (const f of flames) f.scale.y = 0.8 + Math.random() * 0.4;
	stoveLight.intensity = 1.8 + Math.random() * 0.4;
	steam.forEach((s, i) => {
		const p = (t * 0.25 + i / steam.length) % 1;
		s.position.set(2.6 + Math.sin(p * 6 + i) * 0.15, 0.75 + p * 1.6, 0.1);
		s.scale.setScalar(0.25 + p * 0.6);
		s.material.opacity = Math.sin(p * Math.PI) * 0.35;
	});

	renderer.render(scene, camera);
});
