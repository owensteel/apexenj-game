/*

    3D elements

*/

import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';

const gameStageWrapper = document.getElementById("game-stage-wrapper");

// Initialize Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / 300, 0.1, 1000);
camera.position.set(0, 0, 30);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xffffff, 0);
renderer.setSize(window.innerWidth, 300);
renderer.domElement.setAttribute("id", "game-stage")
gameStageWrapper.appendChild(renderer.domElement);

// Outline filter

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const outlinePass = new OutlinePass(
    new THREE.Vector2(window.innerWidth, 300),
    scene,
    camera
);
composer.addPass(outlinePass);

// Optionally configure the outline color, thickness, etc.
outlinePass.edgeStrength = 10;
outlinePass.edgeGlow = 0.0;
outlinePass.edgeThickness = 0.5;
outlinePass.visibleEdgeColor.set('#000000');
outlinePass.hiddenEdgeColor.set('#ffffff');

// Utility

function renderScene() {
    renderer.render(scene, camera);

    outlinePass.selectedObjects = scene.children;
    composer.render();
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

function translateMeshInWorld(mesh, offsetX, offsetY) {
    // Step 1: Build the offset in world space
    const offsetWorld = new THREE.Vector3(offsetX, offsetY, 0);

    // Step 2: We want to transform this world-space offset 
    //         back into the mesh’s local coordinate space,
    //         so adding it to mesh.position will move the mesh in world space 
    //         the way we want.
    // 
    // We'll extract the mesh’s rotation & scale from its matrixWorld, invert that,
    // and apply it to offsetWorld.

    // Make sure matrixWorld is updated
    mesh.updateMatrixWorld(true);

    // Extract rotation+scale from matrixWorld
    const rotScaleMatrix = new THREE.Matrix4().extractRotation(mesh.matrixWorld);
    // If there's a uniform scale you might do:
    //   rotScaleMatrix.extractRotation(mesh.matrixWorld).scale(...);
    // For non-uniform scale, you'd want a more advanced approach.

    // Invert to go from world to local direction
    const invRot = new THREE.Matrix4().copy(rotScaleMatrix).invert();

    // Apply inverse to offset
    offsetWorld.applyMatrix4(invRot);

    // Step 3: Now offsetWorld is the correct local offset to achieve that world shift
    mesh.position.x += offsetWorld.x;
    mesh.position.y += offsetWorld.y;
    mesh.position.z += offsetWorld.z;
}

function convertNodePosIntoWorldPos(nodePos, organismMesh) {
    const nodeClone = {}
    for (const key of Object.keys(nodePos)) {
        nodeClone[key] = nodePos[key]
    }

    // We clone the node because otherwise the X and Y of the original
    // node will be updated to the world X and Y, and we will lose the
    // local positions

    nodeClone.localNode = nodePos

    // Calc real world positions, factoring in mesh position and rotation

    const localVec = new THREE.Vector3(nodePos.x, nodePos.y, 0);
    localVec.applyMatrix4(organismMesh.matrixWorld);

    nodeClone.x = localVec.x
    nodeClone.y = localVec.y

    return nodeClone
}

export {
    scene,
    renderScene,
    loadModel,
    translateMeshInWorld,
    convertNodePosIntoWorldPos
}