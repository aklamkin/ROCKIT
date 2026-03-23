import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let renderer, camera, scene, controls;
let animationCallbacks = [];

export function initScene(container) {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8AACCC);
  scene.fog = new THREE.FogExp2(0x8AACCC, 0.0004);

  const aspect = container.clientWidth / container.clientHeight;
  camera = new THREE.PerspectiveCamera(45, aspect, 1, 3000);
  camera.position.set(300, 250, 320);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 30;
  controls.maxDistance = 1200;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.target.set(0, 60, 0);
  controls.update();

  // Lighting — bright daylight matching Apple Maps look
  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  scene.add(new THREE.HemisphereLight(0x9DC8E8, 0x665544, 0.5));

  const sun = new THREE.DirectionalLight(0xfff8ee, 1.6);
  sun.position.set(150, 350, 120);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.camera.left = -350;
  sun.shadow.camera.right = 350;
  sun.shadow.camera.top = 400;
  sun.shadow.camera.bottom = -100;
  sun.shadow.camera.far = 800;
  sun.shadow.bias = -0.001;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xffe0c0, 0.35);
  fill.position.set(-100, 80, 120);
  scene.add(fill);

  // Ground plane (expanded for context buildings)
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1200, 1200),
    new THREE.MeshStandardMaterial({ color: 0x4A4A50, roughness: 0.9 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  ground.userData.isGround = true;
  scene.add(ground);

  window.addEventListener('resize', () => {
    const w = container.clientWidth, h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  (function animate() {
    requestAnimationFrame(animate);
    controls.update();
    for (const cb of animationCallbacks) cb();
    renderer.render(scene, camera);
  })();

  return { renderer, camera, scene, controls };
}

export function getRenderer() { return renderer; }
export function getCamera() { return camera; }
export function getScene() { return scene; }
export function getControls() { return controls; }
export function onAnimate(cb) { animationCallbacks.push(cb); }
export function removeAnimateCallback(cb) { animationCallbacks = animationCallbacks.filter(c => c !== cb); }

export function resetCameraView() {
  animateCameraTo(new THREE.Vector3(300, 250, 320), new THREE.Vector3(0, 60, 0), 800);
}

export function animateCameraTo(targetPos, targetLookAt, duration = 600) {
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const startTime = performance.now();
  const smoothstep = t => t * t * (3 - 2 * t);
  (function update() {
    const t = Math.min((performance.now() - startTime) / duration, 1);
    const s = smoothstep(t);
    camera.position.lerpVectors(startPos, targetPos, s);
    controls.target.lerpVectors(startTarget, targetLookAt, s);
    controls.update();
    if (t < 1) requestAnimationFrame(update);
  })();
}
