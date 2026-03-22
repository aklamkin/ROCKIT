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
  scene.fog = new THREE.FogExp2(0x1a1c2e, 0.0008);

  // Camera — positioned to see the full campus
  const aspect = container.clientWidth / container.clientHeight;
  camera = new THREE.PerspectiveCamera(45, aspect, 1, 2000);
  camera.position.set(250, 200, 280);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 30;
  controls.maxDistance = 800;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.target.set(0, 60, 0);
  controls.update();

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0x87CEEB, 0x444444, 0.4);
  scene.add(hemi);

  // Sun — positioned to cast realistic shadows across the campus
  const sun = new THREE.DirectionalLight(0xfff5e6, 1.4);
  sun.position.set(100, 250, 80);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.camera.left = -250;
  sun.shadow.camera.right = 250;
  sun.shadow.camera.top = 300;
  sun.shadow.camera.bottom = -50;
  sun.shadow.camera.far = 600;
  sun.shadow.bias = -0.001;
  scene.add(sun);

  // Warm fill from front-left
  const fill = new THREE.DirectionalLight(0xffe0c0, 0.3);
  fill.position.set(-80, 60, 100);
  scene.add(fill);

  // Ground plane — large enough for the full campus
  const groundGeo = new THREE.PlaneGeometry(800, 800);
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

  // Grid helper (subtle)
  const grid = new THREE.GridHelper(800, 160, 0x2a2a38, 0x222230);
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
    new THREE.Vector3(250, 200, 280),
    new THREE.Vector3(0, 60, 0),
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
