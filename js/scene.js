import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let renderer, camera, scene, controls;
let animationCallbacks = [];

export function initScene(container) {
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1c2e);
  scene.fog = new THREE.FogExp2(0x1a1c2e, 0.0015);

  // Camera
  const aspect = container.clientWidth / container.clientHeight;
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 800);
  camera.position.set(80, 65, 90);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 15;
  controls.maxDistance = 300;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.target.set(5, 25, 10);
  controls.update();

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0x87CEEB, 0x444444, 0.4);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff5e6, 1.4);
  sun.position.set(40, 80, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -100;
  sun.shadow.camera.right = 100;
  sun.shadow.camera.top = 120;
  sun.shadow.camera.bottom = -30;
  sun.shadow.camera.far = 300;
  sun.shadow.bias = -0.001;
  scene.add(sun);

  // Warm fill from front-left
  const fill = new THREE.DirectionalLight(0xffe0c0, 0.3);
  fill.position.set(-30, 20, 40);
  scene.add(fill);

  // Ground plane
  const groundGeo = new THREE.PlaneGeometry(400, 400);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a35,
    roughness: 0.9,
    metalness: 0.0
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  ground.userData.isGround = true;
  scene.add(ground);

  // Grid helper for reference (subtle)
  const grid = new THREE.GridHelper(400, 100, 0x2a2a38, 0x222230);
  grid.position.y = 0.01;
  scene.add(grid);

  // Resize
  window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    for (const cb of animationCallbacks) cb();
    renderer.render(scene, camera);
  }
  animate();

  return { renderer, camera, scene, controls };
}

export function getRenderer() { return renderer; }
export function getCamera() { return camera; }
export function getScene() { return scene; }
export function getControls() { return controls; }

export function onAnimate(callback) {
  animationCallbacks.push(callback);
}

export function removeAnimateCallback(callback) {
  animationCallbacks = animationCallbacks.filter(cb => cb !== callback);
}

export function resetCameraView() {
  animateCameraTo(
    new THREE.Vector3(80, 65, 90),
    new THREE.Vector3(5, 25, 10),
    800
  );
}

export function animateCameraTo(targetPos, targetLookAt, duration = 600) {
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const startTime = performance.now();

  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  function update() {
    const elapsed = performance.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    const s = smoothstep(t);

    camera.position.lerpVectors(startPos, targetPos, s);
    controls.target.lerpVectors(startTarget, targetLookAt, s);
    controls.update();

    if (t < 1) {
      requestAnimationFrame(update);
    }
  }
  requestAnimationFrame(update);
}
