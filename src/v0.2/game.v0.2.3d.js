/*

    3D elements

*/

import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'

const gameStageWrapper = document.getElementById("game-stage-wrapper");

// Initialize Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / 300, 0.1, 1000);
camera.position.set(0, 0, 20);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xffffff, 0);
renderer.setSize(window.innerWidth, 300);
renderer.domElement.setAttribute("id", "game-stage")
gameStageWrapper.appendChild(renderer.domElement);

function renderScene() {
    renderer.render(scene, camera);
}

async function loadModel(objUrl) {
    const loader = new OBJLoader();

    try {
        const obj = await new Promise((resolve, reject) => {
            loader.load(
                objUrl,
                resolve, // Call resolve on successful load
                undefined, // Progress callback
                reject // Call reject on error
            );
        });

        return obj; // Return the loaded OBJ model
    } catch (error) {
        console.error('Error loading OBJ model:', error);
        throw error;
    }
}

// Debug purposes, to check camera can see far enough
function addCubeAtPos(x, y, z) {
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({ color: 'red' })
    )
    scene.add(cube)
    cube.position.set(x, y, z);
}

export { scene, renderScene, loadModel }