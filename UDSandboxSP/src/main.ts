import * as THREE from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { setupPhysics, loadMap, world, characterBody, cubeBody, helicopterMixer } from './dev/map';
import { Interact } from './main/functions';
import { Vector2, Raycaster } from "three";
import { stats, DevGUI } from './dev/dev';
import HotbarUI from './ui/hotbar';

export var scene: THREE.Scene;
export var camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
export var gltfModel: THREE.Group | null = null;
const cubeSpeed = 0.02;
const keysPressed: { [key: string]: boolean } = {};
const gravity = -0.02;
const rotationSpeed = 0.005;
const animationSpeed = 0.5;
let verticalVelocity = 0;
let isJumping = false;
let isInAir = false;

let isRightMouseDown = false;
let previousMouseX = 0;
let cameraDistance = 4;

let directionalLight: THREE.DirectionalLight;

let mixer: THREE.AnimationMixer;
let idleAction: THREE.AnimationAction;
let walkFAction: THREE.AnimationAction;
let walkBAction: THREE.AnimationAction;
let jumpAction: THREE.AnimationAction;
let activeAction: THREE.AnimationAction;
let previousAction: THREE.AnimationAction

export const raycaster = new Raycaster();
export const mouse = new Vector2();

function Init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x292930);

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 10, 10);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.1;
  directionalLight.shadow.camera.far = 50;
  scene.add(directionalLight);

  camera.position.set(0, 0, cameraDistance);
  camera.lookAt(0, 0, 0);

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('contextmenu', (event) => event.preventDefault());

  setupPhysics();
  loadMap();
  DevGUI();
  loadGLTFModel();
  
  /* Interactions */
  window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  });

  window.addEventListener('click', () => {
    Interact();
  });

  HotbarUI();
  animate();
}

function onKeyDown(event: KeyboardEvent) {
  keysPressed[event.key.toLowerCase()] = true;
  
  if (event.code === 'Space' && !isJumping && characterBody.position.y <= 0.5) {
    isJumping = true;
    isInAir = true;
    verticalVelocity = 0.4;
    switchAnimation(jumpAction);
  }
}

function onKeyUp(event: KeyboardEvent) {
  keysPressed[event.key.toLowerCase()] = false;
}

function onMouseDown(event: MouseEvent) {
  if (event.button === 2) {
    isRightMouseDown = true;
    previousMouseX = event.clientX;
  }
}

function onMouseUp(event: MouseEvent) {
  if (event.button === 2) {
    isRightMouseDown = false;
  }
}

function onMouseMove(event: MouseEvent) {
  if (isRightMouseDown && gltfModel) {
    const deltaX = event.clientX - previousMouseX;

    gltfModel.rotation.y += deltaX * rotationSpeed;
    camera.position.x = gltfModel.position.x + cameraDistance * Math.sin(gltfModel.rotation.y);
    camera.position.z = gltfModel.position.z + cameraDistance * Math.cos(gltfModel.rotation.y);

    previousMouseX = event.clientX;

    directionalLight.position.set(
      gltfModel.position.x + 10 * Math.sin(gltfModel.rotation.y + Math.PI / 4),
      gltfModel.position.y + 10,
      gltfModel.position.z + 10 * Math.cos(gltfModel.rotation.y + Math.PI / 4)
    );
    directionalLight.target.position.set(gltfModel.position.x, gltfModel.position.y, gltfModel.position.z);
  }
}

function loadGLTFModel() {
  const loader = new GLTFLoader();
  loader.load(
    'src/assets/models/[Characters]/character_agent/character_agent.glb',
    (gltf) => {
      gltfModel = gltf.scene;
      const scale = 0.8;
      gltfModel.scale.set(scale, scale, scale);
      gltfModel.castShadow = true;
      scene.add(gltfModel);
      mixer = new THREE.AnimationMixer(gltfModel);

      const animations = gltf.animations;

      if (animations && animations.length > 0) {
        console.log('Animations loaded:', animations.map(clip => clip.name));
      } else {
        console.error('No animations found');
      }

      idleAction = mixer.clipAction(animations.find(clip => clip.name.toLowerCase() === 'idle') || animations[0]);
      walkFAction = mixer.clipAction(animations.find(clip => clip.name.toLowerCase() === 'walkf') || animations[1]);
      walkBAction = mixer.clipAction(animations.find(clip => clip.name.toLowerCase() === 'walkb') || animations[2]);
      jumpAction = mixer.clipAction(animations.find(clip => clip.name.toLowerCase() === 'jump') || animations[3]);

      idleAction.timeScale = animationSpeed;
      walkFAction.timeScale = animationSpeed;
      walkBAction.timeScale = animationSpeed;
      jumpAction.timeScale = animationSpeed;
      
      if (!idleAction || !walkFAction || !walkBAction || !jumpAction) {
        console.error('No animations found');
      }

      activeAction = idleAction;
      activeAction.play();
    },
    undefined,
    (error) => {
      console.error('An error happened while loading the model:', error);
    }
  );
}

function switchAnimation(toAction: THREE.AnimationAction) {
  if (activeAction !== toAction) {
    previousAction = activeAction;
    activeAction = toAction;

    if (previousAction) {
      previousAction.fadeOut(1.0);
    }

    activeAction.reset().fadeIn(1.0).play();
  }
}

function animate() {
  requestAnimationFrame(animate);
  
  const deltaTime = 1 / 60;
  world.step(deltaTime);

  if (gltfModel) {
    const movement = new THREE.Vector3();
    let isMoving = false;

    if (keysPressed['s']) {
      movement.z -= cubeSpeed;
      isMoving = true;
      switchAnimation(walkBAction);
    } else if (keysPressed['w']) {
      movement.z += cubeSpeed;
      isMoving = true;
      switchAnimation(walkFAction);
    } else if (keysPressed['d']) {
      movement.x -= cubeSpeed;
      isMoving = true;
    } else if (keysPressed['a']) {
      movement.x += cubeSpeed;
      isMoving = true;
    }

    if (isJumping) {
      if (isInAir) {
        verticalVelocity += gravity;
        characterBody.position.y += verticalVelocity;

        if (characterBody.position.y <= 0.5) {
          characterBody.position.y = 0.5;
          isInAir = false;
          verticalVelocity = 0;
          isJumping = false;
          switchAnimation(idleAction);
        }
      }
    } else if (!isMoving) {
      switchAnimation(idleAction);
    }

    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();

    const rightDirection = new THREE.Vector3();
    rightDirection.crossVectors(camera.up, cameraDirection);
    rightDirection.normalize();

    const forwardMovement = cameraDirection.multiplyScalar(movement.z);
    const rightMovement = rightDirection.multiplyScalar(movement.x);

    const finalMovement = forwardMovement.add(rightMovement);
    characterBody.position.x += finalMovement.x;
    characterBody.position.z += finalMovement.z;

    gltfModel.position.copy(characterBody.position as any);
    mixer.update(deltaTime);
  }

  const cube = scene.children.find((child) => child instanceof THREE.Mesh && child.geometry instanceof THREE.BoxGeometry);
  if (cube) {
    cube.position.copy(cubeBody.position as any);
    cube.quaternion.copy(cubeBody.quaternion as any);
  }

  if (helicopterMixer) {
    helicopterMixer.update(deltaTime);
  }

  stats.update();
  updateCameraPosition();
  renderer.render(scene, camera);
}

export function updateCameraPosition() {
  if (gltfModel) {
    const offsetDistance = cameraDistance;
    const cameraOffsetX = offsetDistance * Math.sin(gltfModel.rotation.y);
    const cameraOffsetZ = offsetDistance * Math.cos(gltfModel.rotation.y);

    camera.position.set(
      gltfModel.position.x - cameraOffsetX,
      gltfModel.position.y + 1.5,
      gltfModel.position.z - cameraOffsetZ
    );
    camera.lookAt(gltfModel.position);

    directionalLight.position.set(
      gltfModel.position.x + 10 * Math.sin(gltfModel.rotation.y + Math.PI / 4),
      gltfModel.position.y + 10,
      gltfModel.position.z + 10 * Math.cos(gltfModel.rotation.y + Math.PI / 4)
    );
    directionalLight.target.position.set(gltfModel.position.x, gltfModel.position.y, gltfModel.position.z);
  }
}

Init();