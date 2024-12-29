/*

    3D elements

*/

import * as THREE from 'three';

const gameStageWrapper = document.getElementById("game-stage-wrapper");

// Initialize Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 600 / 300, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xffffff, 0);
renderer.setSize(600, 300);
renderer.domElement.setAttribute("id", "game-stage")
gameStageWrapper.appendChild(renderer.domElement);

function renderScene() {
    renderer.render(scene, camera);
}

export { scene, renderScene }