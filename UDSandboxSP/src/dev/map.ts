import * as THREE from "three";
import * as CANNON from "cannon-es";
import { scene } from "../main";

export var world: CANNON.World;
export var characterBody: CANNON.Body;
export var cube: THREE.Mesh;
export var cubeBody: CANNON.Body;

/* -------------------------PHYSICS-START------------------------- */

export function setupPhysics() {
    world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);

    const groundMaterial = new CANNON.Material("groundMaterial");
    const characterMaterial = new CANNON.Material("characterMaterial");
    const cubeMaterial = new CANNON.Material("cubeMaterial");

    const groundBody = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Plane(),
        material: groundMaterial,
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    characterBody = new CANNON.Body({
        mass: 1,
        shape: new CANNON.Sphere(0.5),
        position: new CANNON.Vec3(0, 1, 0),
        material: characterMaterial,
        linearDamping: 0.9,
        angularDamping: 0.9,
    });
    world.addBody(characterBody);

    const characterGroundContact = new CANNON.ContactMaterial(
        characterMaterial,
        groundMaterial,
        {
            friction: 0.3,
            restitution: 0,
        }
    );
    world.addContactMaterial(characterGroundContact);

    const cubeGroundContact = new CANNON.ContactMaterial(
        cubeMaterial,
        groundMaterial,
        {
            friction: 0.4,
            restitution: 0.3,
        }
    );
    world.addContactMaterial(cubeGroundContact);

}

/* -------------------------PHYSICS-END------------------------- */

export function loadMap() {
    addGround();
    addLights();
    addCube();
}

function addGround() {
    const geometry = new THREE.PlaneGeometry(20, 20);
    const material = new THREE.MeshPhongMaterial({
        color: 0x808080,
        side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.01;
    scene.add(plane);
}

function addLights() {
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
}

function addCube() {
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.castShadow = true;
    cube.name = 'interactiveCube';
    scene.add(cube);

    cubeBody = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(2, 0.5, 0),
        material: new CANNON.Material("cubeMaterial"),
    });
    cubeBody.addShape(new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)));
    world.addBody(cubeBody);
}