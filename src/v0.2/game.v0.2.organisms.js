/*

    Organism

*/

import * as THREE from 'three';
import * as ThreeElements from './game.v0.2.3d.js'
import * as OrganismBuilder from './game.v0.2.organism.builder.js'

// Global variables

const organisms = [];
const defaultMeshEdges = 6;
const defaultMeshSize = 0.75;

// Render nodes as points

function renderNodePoints(
    currentNode,
    x = 0,
    y = 0,
    level = 0,
    angleStart = -(Math.PI),
    angleEnd = Math.PI,
    parentNodeMesh = null
) {
    // Check node type

    if (currentNode.role !== "appendage" && currentNode.role !== "root") {
        // Apply any properties to parent

        if (currentNode.role == "color") {
            parentNodeMesh.material = new THREE.MeshBasicMaterial({ color: currentNode.value });
        }

        return null
    }

    // Create point geometry

    const pointShape = new THREE.Shape();
    const angleStep = (2 * Math.PI) / defaultMeshEdges;

    // Point is represented by a simple flat hexagon currently
    // but only for the sake of being visible in Three JS

    for (let i = 0; i < defaultMeshEdges; i++) {
        const angle = i * angleStep;
        const drawX = (Math.cos(angle) * defaultMeshSize);
        const drawY = (Math.sin(angle) * defaultMeshSize);

        if (i === 0) {
            pointShape.moveTo(drawX, drawY);
        } else {
            pointShape.lineTo(drawX, drawY);
        }
    }
    pointShape.closePath();
    const pointMesh = new THREE.Mesh(
        new THREE.ExtrudeGeometry(pointShape, {
            depth: 1,
            bevelEnabled: false
        }),
        new THREE.MeshBasicMaterial({ color: 'black' })
    );
    pointMesh.position.x = x
    pointMesh.position.y = y

    // Offshoots

    // If there are no offshoots, stop
    if (!currentNode.offshoots || currentNode.offshoots.length === 0) {
        return pointMesh;
    }

    const childCount = currentNode.offshoots.length;
    const angleSlice = (angleEnd - angleStart) / childCount;

    // The distance from parent to child (radius).
    const radius = defaultMeshSize;

    // Place each child

    currentNode.offshoots.forEach((child, idx) => {
        // For multiple children, we subdivide the angle range
        const childAngle = angleStart + angleSlice * (idx + /* branch offset: */ (0.5));

        // Convert polar coords to cartesian
        const childX = radius * Math.cos(childAngle);
        const childY = radius * Math.sin(childAngle);

        // Recurse for the child
        // Confine each child to its own angle segment
        const subAngleStart = angleStart + angleSlice * idx;
        const subAngleEnd = angleStart + angleSlice * (idx + 1);

        const offshootNodeMesh = renderNodePoints(
            child,
            childX,
            childY,
            level + 1,
            subAngleStart,
            subAngleEnd,
            pointMesh
        );
        if (offshootNodeMesh) {
            pointMesh.add(offshootNodeMesh)
        }
    });

    return pointMesh;
}

// Motion

const STEP_SIZE = 0.05;
function randomOffset() {
    return (Math.random() * 2 - 1) * STEP_SIZE;
}

// Organism class

class Organism {
    constructor(dnaSequence, combatStartPos = { x: 0, y: 0 }) {
        this.id = String(Math.random()).split(".")[1]
        this.dnaSequence = dnaSequence;
        this.mesh = null;
        this.meshOutline = null;
        this.nodePositions = []
        this.combatStartPos = combatStartPos
        this.currentAnimations = {
            highlight: false
        }

        this.velocity = {
            x: Math.random() > 0.5 ? 0.01 : -0.01,
            y: Math.random() > 0.5 ? 0.01 : -0.01
        }; // Default velocity

        if (this.dnaSequence.detach == true) {
            // Root can never detach (obviously)
            // WARNING: This will permanently corrupt DNA
            // so this is why a child node's sequence must
            // be cloned before being used
            this.dnaSequence.detach = false
        }

        this.rebuildMesh();
    }
    updateTraitsFromDNA(dnaSequence) {
        this.dnaSequence = dnaSequence;
        this.rebuildMesh();
    }
    rebuildMesh() {
        // Create mesh for all nodes

        if (movementToggle) {

            // Live mode

            this.mesh = OrganismBuilder.buildSeamlessBodyFromNodes(
                this.dnaSequence,
                /* allowDetachingParts: */ false,
                // In live mode, the organism is only built once, so we
                // can afford the expensive operation to use CSG to union
                // all nodes into one single mesh
                /* formUnionMesh: */ false
            );
            this.mesh.position.set(
                this.combatStartPos.x,
                this.combatStartPos.y,
                0
            )

            // Save positions of (attached) nodes for overlapping
            // detection in combat
            this.nodePositions = OrganismBuilder.gatherNodePositions(
                this.dnaSequence,
                /* allowDetachingParts: */ false
            )

            // Separate detachable parts into individual organisms
            const detachedParts = OrganismBuilder.gatherNodePositions(
                this.dnaSequence,
                /* allowDetachingParts: */ true
            ).filter(
                (obj) => {
                    return obj.detach
                }
            )
            detachedParts.forEach((detachedPartPos) => {
                // Clone to prevent main DNA being corrupted
                const detachedPartDNA = JSON.parse(JSON.stringify(detachedPartPos.node))
                const detachedPartOrganism = addOrganism(detachedPartDNA)

                // Move part to starting position
                detachedPartOrganism.mesh.position.set(
                    this.combatStartPos.x + detachedPartPos.x,
                    this.combatStartPos.y + detachedPartPos.y,
                    0
                )

                // Set velocity to spin away from parent
                detachedPartOrganism.velocity.x = 0 - this.velocity.x
                detachedPartOrganism.velocity.y = 0 - this.velocity.y
            })
        } else {
            // Build mode, static

            const newMesh = OrganismBuilder.buildSeamlessBodyFromNodes(
                this.dnaSequence,
                /* allowDetachingParts: */ true
            );
            if (this.mesh) {
                ThreeElements.scene.remove(this.mesh)
                newMesh.rotation.copy(this.mesh.rotation)
            }
            this.mesh = newMesh
            this.mesh.position.set(0, 0, 0)
        }
        this.mesh.material = new THREE.MeshBasicMaterial({ color: this.dnaSequence.block.color });

        ThreeElements.scene.add(this.mesh);
    }
    updateMovement() {
        if (this.mesh == null) {
            return
        }
        if (movementToggle) {
            // Float around
            this.mesh.position.x += this.velocity.x + randomOffset()
            this.mesh.position.y += this.velocity.y + randomOffset()
        } else {
            // Rotate idly
            this.mesh.rotation.z += Math.sin(Date.now() * 0.001) * Math.random() * 0.005;
        }
    }
    highlight() {
        if (this.mesh == null || this.currentAnimations.highlight) {
            return
        }
        this.currentAnimations.highlight = true;

        this.mesh.material = new THREE.MeshBasicMaterial({ color: 'red' });

        setTimeout(() => {
            this.currentAnimations.highlight = false;
            this.mesh.material = new THREE.MeshBasicMaterial({ color: this.dnaSequence.block.color });
        }, 250)
    }
}

// Main render loop
let activeAnimation = null;
let movementToggle = false
function animate() {
    if (activeAnimation) cancelAnimationFrame(activeAnimation);

    function renderFrame() {
        organisms.forEach((organism) => {
            // Skip if no mesh yet
            if (organism.mesh == null) {
                return
            }
            organism.updateMovement()
            // Bounce off edges regardless
            if (
                (organism.mesh.position.x >= 16 && Math.sign(organism.velocity.x) > 0)
                ||
                (organism.mesh.position.x <= -16 && Math.sign(organism.velocity.x) < 0)
            ) {
                organism.velocity.x = -organism.velocity.x;
            }
            if (
                (organism.mesh.position.y >= 7 && Math.sign(organism.velocity.y) > 0)
                ||
                (organism.mesh.position.y <= -7 && Math.sign(organism.velocity.y) < 0)
            ) {
                organism.velocity.y = -organism.velocity.y;
            }
        });
        ThreeElements.renderScene();
        activeAnimation = requestAnimationFrame(renderFrame);
    }

    renderFrame();
}
animate()

function addOrganism(dnaSequence, combatStartPos = { x: 0, y: 0 }) {
    const newOrganism = new Organism(dnaSequence, combatStartPos);
    organisms.push(newOrganism);
    return newOrganism
}

function rebuildAllOrganisms() {
    organisms.forEach((organism) => {
        organism.rebuildMesh()
    })
}

function clearScene() {
    organisms.forEach((organism) => {
        ThreeElements.scene.remove(organism.mesh)
    })
}

function setMovementToggle(state, playerOrganism) {
    movementToggle = state

    clearScene()

    if (movementToggle == false) {
        // Permanently delete anything that might
        // have been created in live mode
        // And restore original player only
        while (organisms.length > 0) {
            organisms.pop();
        }
        organisms.push(playerOrganism)
    }

    rebuildAllOrganisms()
}

function getAllOrganisms() {
    return organisms
}

export { addOrganism, setMovementToggle, rebuildAllOrganisms, clearScene, getAllOrganisms };