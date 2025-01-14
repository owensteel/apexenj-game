/*

    Organism

*/

import * as THREE from 'three';
import * as ThreeElements from './game.v0.2.3d.js'
import * as OrganismBuilder from './game.v0.2.organism.builder.js'
import { cloneObject } from './game.v0.2.utils.js';
import * as Utils from './game.v0.2.utils.js'
import * as Blocks from './game.v0.2.blocks.js';

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
        this.bondedTo = [];
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
                const detachedPartDNA = cloneObject(detachedPartPos.node)
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
        if (this.dnaSequence.block.typeName == "motor") {
            this.mesh.rotation.x += 0.1
        }
        if (this.bondedTo.length < 1) {
            if (movementToggle) {
                // Float around
                this.mesh.position.x += this.velocity.x + randomOffset()
                this.mesh.position.y += this.velocity.y + randomOffset()
            } else {
                // Rotate idly
                this.mesh.rotation.z += Math.sin(Date.now() * 0.001) * Math.random() * 0.005;
            }
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

            if (organism.bondedTo.length < 1) {
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
    organisms.forEach((organism, index) => {
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

// TODO: Fix disappearing root node problem
function bondOrganisms(joineeNode, joinerNode) {
    // Find the pivot in world coords (the joinerNode).
    // This is the position to remain fixed after bonding.
    const joinerPivotWorld = {
        x: joinerNode.instance.mesh.position.x + joinerNode.x,
        y: joinerNode.instance.mesh.position.y + joinerNode.y
    };

    // Convert all joinee nodes to the new local coords (relative to the pivot).
    const newJoineeNodes = joineeNode.instance.nodePositions.map(nodePos => {
        // Current world coords of this node
        const worldX = joineeNode.instance.mesh.position.x + nodePos.x;
        const worldY = joineeNode.instance.mesh.position.y + nodePos.y;

        // Shift so that pivot becomes (0,0) in the new local space
        return {
            x: worldX - joinerPivotWorld.x,
            y: worldY - joinerPivotWorld.y,
            z: 0,
            detach: (nodePos.node.detach == true),
            node: nodePos.node,
            level: nodePos.level
        };
    });

    // Convert all joiner nodes to the same new local coords
    const newJoinerNodes = joinerNode.instance.nodePositions.map(nodePos => {
        const worldX = joinerNode.instance.mesh.position.x + nodePos.x;
        const worldY = joinerNode.instance.mesh.position.y + nodePos.y;

        return {
            x: worldX - joinerPivotWorld.x,
            y: worldY - joinerPivotWorld.y,
            z: 0,
            detach: (nodePos.node.detach == true),
            node: nodePos.node,
            level: nodePos.level
        };
    });

    // Combine the two sets of local nodes
    const combinedNodes = [...newJoineeNodes, ...newJoinerNodes];

    // Clean up old organisms
    joineeNode.instance.nodePositions = [];
    joinerNode.instance.nodePositions = [];
    joineeNode.instance.bondedTo.push(joinerNode.instance);
    joinerNode.instance.bondedTo.push(joineeNode.instance);
    ThreeElements.scene.remove(joineeNode.instance.mesh);
    ThreeElements.scene.remove(joinerNode.instance.mesh);

    // Configure nodes
    combinedNodes.forEach((n) => {
        // Scrub
        delete n["instance"]

        // For any "bonded" blocks, change their color
        if (n.node.block.isBonded) {
            n.node.block.color = "green";
        }
    });

    // Create the new (combined) organism
    const placeholderDefaultRootNode = {
        role: "root",
        block: new Blocks.HeartBlock(),  // arbitrary temp root definition
        detach: false,
        offshoots: []
    }
    const combinedOrganism = addOrganism(placeholderDefaultRootNode);

    // Remove its default mesh from the scene
    ThreeElements.scene.remove(combinedOrganism.mesh);

    // Assign the merged nodePositions & build a new mesh
    combinedOrganism.nodePositions = combinedNodes;
    combinedOrganism.mesh = OrganismBuilder.buildBodyFromNodePositions(
        combinedOrganism.nodePositions
    );

    if (!combinedOrganism.mesh) {
        console.warn("Failed to build combined mesh; probably empty node array.");
        return;
    }

    // Place the new mesh so that pivot remains at the same world position
    // i.e. pivot is now local (0,0), so put the mesh at pivot's old coords.
    combinedOrganism.mesh.position.set(joinerPivotWorld.x, joinerPivotWorld.y, 0);

    // Add the combined mesh to the scene
    ThreeElements.scene.add(combinedOrganism.mesh);

    console.log("Bonded organisms...", combinedNodes);
}

export { addOrganism, setMovementToggle, rebuildAllOrganisms, clearScene, getAllOrganisms, bondOrganisms };