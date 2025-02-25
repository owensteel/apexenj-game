/*

    3D elements

    Provides access to Three JS elements and utilities for the 3D world.

*/

import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { NODESIZE_DEFAULT } from './game.v1.references'

const gameWrapper = document.getElementById('game-wrapper')
const gameStageWrapper = document.createElement("game-stage-wrapper");
gameWrapper.appendChild(gameStageWrapper)

// Initialize Three.js scene

const canvasWidth = Math.min(400, gameWrapper.clientWidth);
const canvasHeight = Math.min(700, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
    -canvasWidth / 2,   // left
    canvasWidth / 2,   // right
    canvasHeight / 2,  // top
    -canvasHeight / 2,  // bottom
    1,            // near clipping plane
    1000          // far clipping plane
);
// With an orthographic camera, distance has no effect
camera.position.set(0, 0, 50);
camera.lookAt(0, 0, 0);

const ambLighting = new THREE.AmbientLight("#fff", 0.25);
scene.add(ambLighting)

const defLighting = new THREE.PointLight("#fff", 4, 0, 0);
scene.add(defLighting)

const ThreeRenderer = new THREE.WebGLRenderer({
    preserveDrawingBuffer: true,
    antialias: true
});
ThreeRenderer.setClearColor("#ffffff", 0);
ThreeRenderer.setSize(canvasWidth, canvasHeight);

const ThreeCanvas = ThreeRenderer.domElement
ThreeCanvas.setAttribute("id", "game-stage")
gameStageWrapper.appendChild(ThreeCanvas);

// Outline filter

const composer = new EffectComposer(ThreeRenderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const outlinePass = new OutlinePass(
    new THREE.Vector2(canvasWidth, canvasHeight),
    scene,
    camera
);
composer.addPass(outlinePass);

outlinePass.edgeStrength = 100;
outlinePass.edgeGlow = 0;
outlinePass.edgeThickness = 0.1;
outlinePass.visibleEdgeColor.set('#000');
outlinePass.hiddenEdgeColor.set('#fff');

// Main renderer, called in the animation loop

function renderScene() {
    ThreeRenderer.render(scene, camera);

    outlinePass.selectedObjects = scene.children;
    composer.render();
}

const RENDERS_PER_SEC = 12
function renderLoop() {
    renderScene()
    setTimeout(renderLoop, 1000 / RENDERS_PER_SEC)
}
renderLoop()

// Loads an OBJ model from a URL and returns it as a "scene"
// NOTE: Currently not used anywhere
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

// For debugging purposes, to check camera can see far enough
function addCubeAtPos(x, y, z) {
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(15, 15, 15),
        new THREE.MeshBasicMaterial({ color: 'red' })
    )
    scene.add(cube)
    cube.position.set(x, y, z);
}

// A solution for "bumping" organisms when they have complicated positions
// and rotations
function translateMeshInWorld(mesh, offsetX, offsetY) {
    // Build the offset in world space
    const offsetWorld = new THREE.Vector3(offsetX, offsetY, 0);

    // Transform this world-space offset back into the mesh’s local coordinate space
    // Adding it to mesh.position will move the mesh in world space
    // Extract the mesh’s rotation and scale from its matrixWorld, invert that,
    // and apply it to offsetWorld

    // Make sure matrixWorld is updated
    mesh.updateMatrixWorld(true);

    // Extract rotation+scale from matrixWorld
    const rotScaleMatrix = new THREE.Matrix4().extractRotation(mesh.matrixWorld);
    // Assumes uniform scale

    // Invert to go from world to local direction
    const invRot = new THREE.Matrix4().copy(rotScaleMatrix).invert();

    // Apply inverse to offset
    offsetWorld.applyMatrix4(invRot);

    // Now offsetWorld is the correct local offset to achieve that world shift
    mesh.position.x += offsetWorld.x;
    mesh.position.y += offsetWorld.y;
    mesh.position.z += offsetWorld.z;
}

// Gets the position of a node in the 3D space, factoring in instance's and
// parent's rotations
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

// For rotating meshes on a 2D axis in 3D space
function rotateMeshToTarget(mesh, nx, ny, targetX, targetY) {
    // 1) localAngle: The angle from the mesh's origin to the node in local space
    const localAngle = Math.atan2(ny, nx);

    // 2) node's current world coords (assuming no prior rotation on mesh)
    //    If the mesh is at mesh.position.x, mesh.position.y:
    const nodeWorldX = mesh.position.x + nx;
    const nodeWorldY = mesh.position.y + ny;

    // 3) angle from the node's world position to the target
    const targetAngle = Math.atan2(targetY - nodeWorldY, targetX - nodeWorldX);

    // 4) the rotation needed so node points at the target
    const deltaTheta = targetAngle - localAngle;

    // Set the mesh's Z rotation in radians
    if (!isNaN(deltaTheta)) {
        mesh.rotation.z = deltaTheta;
    }
}

// From canvas click coords to 3D space coords
function hit3DFromCanvasClickPos(clickPos) {
    const rect = ThreeRenderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((clickPos.x - rect.left) / rect.width) * 2 - 1,
        -((clickPos.y - rect.top) / rect.height) * 2 + 1
    );

    // Make a new Raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Get all intersections with a group or array of meshes in your scene
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        // intersects[0] is the closest object
        return intersects[0];
    }

    return false
}

// Generate positions of all appendage/root nodes for a DNA sequence
// So converting the node tree into a 2D array of positions
function generateAbsoluteNodePositions(
    nodeSize = NODESIZE_DEFAULT,
    currentNode,
    allowDetachingParts = false,
    x = 0,
    y = 0,
    level = 0,
    positionsArray = [],
    parentNodePos = null,
    currentNodeAngle = 0
) {
    // Prevent null crash
    if (!currentNode) {
        console.warn("Null node encountered while generating positions")
        return;
    }

    if (currentNode.detach === true && !allowDetachingParts) {
        // Do not add entirety of detaching node
        return;
    }

    const currentNodePosIndex = positionsArray.length;
    const currentNodePosFinal = {
        x,
        y,
        z: 0,
        detach: currentNode.detach === true,
        node: currentNode,
        level,
        index: currentNodePosIndex,
        parentNodePos,
        mesh: null,
        angle: currentNodeAngle,
        nodeSize: nodeSize
    };
    positionsArray.push(currentNodePosFinal);

    // For UI to reference
    currentNode.nodePos = currentNodePosFinal

    // The distance from parent to child (can tweak for better spacing)
    const radius = nodeSize * 1.7;

    // For a flat-topped hex, children are spaced at 0°, 60°, 120°, 180°, 240°, 300°

    for (let edgeIndex = 0; edgeIndex < 6; edgeIndex++) {
        const child = currentNode.children[edgeIndex]
        if (!child) {
            continue
        }

        // Add parentNode and edgeOfParent to child as these are
        // references the Builder UI uses that must be refreshed
        child.parentNode = currentNode
        child.edgeOfParent = parseInt(edgeIndex)

        // Each of the 6 directions for a flat-top hex
        const childAngle = (edgeIndex * (Math.PI / 3)) + 1.575;

        // Convert polar to cartesian
        const childX = x + radius * Math.cos(childAngle);
        const childY = y + radius * Math.sin(childAngle);

        // Recurse
        generateAbsoluteNodePositions(
            nodeSize,
            child,
            allowDetachingParts,
            childX,
            childY,
            level + 1,
            positionsArray,
            currentNodePosFinal,
            childAngle
        )
    }

    return positionsArray;
}

// Get 3D stage edges

const stageEdges3D = {
    top: {
        left: {
            x: -(canvasWidth / 2),
            y: (canvasHeight / 2)
        },
        right: {
            x: (canvasWidth / 2),
            y: (canvasHeight / 2)
        }
    },
    bottom: {
        left: {
            x: -(canvasWidth / 2),
            y: -(canvasHeight / 2)
        },
        right: {
            x: (canvasWidth / 2),
            y: -(canvasHeight / 2)
        }
    }
}

function mousePosTo3DPos(mousePos) {
    return {
        x: (mousePos.x - (canvasWidth / 2)),
        y: -(mousePos.y - (canvasHeight / 2))
    }
}

export {
    ThreeRenderer,
    ThreeCanvas,
    scene,
    stageEdges3D,
    loadModel,
    translateMeshInWorld,
    convertNodePosIntoWorldPos,
    rotateMeshToTarget,
    hit3DFromCanvasClickPos,
    mousePosTo3DPos,
    generateAbsoluteNodePositions
}