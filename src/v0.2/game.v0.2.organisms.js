/*

    Organism

*/

import * as THREE from 'three';
import * as ThreeElements from './game.v0.2.3d.js'
import * as OrganismBuilder from './game.v0.2.organism.builder.js'
import { cloneObject } from './game.v0.2.utils.js';
import * as DNA from './game.v0.2.dna.js';
import * as Blocks from './game.v0.2.blocks.js';

// Global variables

const organisms = [];
const defaultCombatStartPos = { x: -15, y: 0 }
const slowDowPerc = 0.001

// Motion

const STEP_SIZE = 0.05;
function randomOffset() {
    return (Math.random() * 2 - 1) * STEP_SIZE;
}

// Organism class

class Organism {
    constructor(dnaSequence, combatStartPos = defaultCombatStartPos) {
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
            x: 0,
            y: 0
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

            // Save positions of (attached) nodes for overlapping
            // detection in combat
            this.nodePositions = OrganismBuilder.gatherNodePositions(
                this.dnaSequence,
                /* allowDetachingParts: */ false
            )

            this.mesh = OrganismBuilder.buildBodyFromNodePositions(
                this.nodePositions,
                /* allowDetachingParts: */ false,
                /* formUnionMesh: */ false
            )
            this.mesh.position.set(
                this.combatStartPos.x,
                this.combatStartPos.y,
                0
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
            this.mesh.rotation.set(0, 0, 0)
        }
        this.mesh.material = new THREE.MeshBasicMaterial({ color: this.dnaSequence.block.color });

        ThreeElements.scene.add(this.mesh);
    }
    updateMovement() {
        if (this.mesh == null) {
            return
        }

        // Rotate motor blocks
        for (const nodePos of this.nodePositions) {
            if (nodePos.node.block.typeName == "motor") {
                nodePos.mesh.rotation.y += 0.1
            }
        }

        // Idle animation
        if (movementToggle) {
            // Float around
            this.mesh.position.x += this.velocity.x + randomOffset()
            this.mesh.position.y += this.velocity.y + randomOffset()

            // Naturally slow down any velocity
            if (Math.abs(this.velocity.x) > 0) {
                this.velocity.x -= slowDowPerc * Math.sign(this.velocity.x)
            }
            if (Math.abs(this.velocity.y) > 0) {
                this.velocity.y -= slowDowPerc * Math.sign(this.velocity.y)
            }
        } else {
            // Rotate idly
            this.mesh.rotation.z += Math.sin(Date.now() * 0.001) * Math.random() * 0.0025;
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

function addOrganism(dnaSequence, combatStartPos = defaultCombatStartPos) {
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

function getNodeRoot(node) {
    let nodeRoot = node;
    while (nodeRoot.parentNodePos) {
        nodeRoot = nodeRoot.parentNodePos
    }
    return nodeRoot
}

function clearUpOrganism(instance) {
    instance.nodePositions = [];
    instance.bondedTo.push(instance);
    ThreeElements.scene.remove(instance.mesh);
}

function bondOrganisms(joineeNode, joinerNode) {

    const joinerInstance = joinerNode.instance
    const joineeInstance = joineeNode.instance

    const joinerMesh = joinerInstance.mesh
    const joineeMesh = joineeInstance.mesh

    const joinerRoot = getNodeRoot(joinerNode)
    const joineeRoot = getNodeRoot(joineeNode)

    // World positions

    const joinerRootWorld = {
        x: joinerRoot.x + joinerMesh.position.x,
        y: joinerRoot.y + joinerMesh.position.y
    }
    const joineeRootWorld = {
        x: joineeRoot.x + joineeMesh.position.x,
        y: joineeRoot.y + joineeMesh.position.y
    }
    const pivotWorld = {
        x: joinerNode.x + joinerMesh.position.x,
        y: joinerNode.y + joinerMesh.position.y
    }

    // Reposition nodes
    // All nodes must be repositioned as nodePositions is a flattened 2D
    // array — in the Organism Builder, the positions of node meshes are
    // made relevant to their parents dynamically, and the relevance does
    // not apply here. Furthermore, the positions in nodePositions should
    // be "world-ready" or the node overlapping detection will not work.

    const newJoinerNodes = joinerInstance.nodePositions
    const newJoineeNodes = joineeInstance.nodePositions

    newJoinerNodes.map(nodePos => {

        const nodeWorldX = joinerMesh.position.x + nodePos.x
        const nodeWorldY = joinerMesh.position.y + nodePos.y

        // Distance from the pivot

        const distancedWorldX = (nodeWorldX - pivotWorld.x)
        const distancedWorldY = (nodeWorldY - pivotWorld.y)

        // Convert back to local

        nodePos.x = distancedWorldX
        nodePos.y = distancedWorldY

        return nodePos

    })

    newJoineeNodes.map(nodePos => {

        const nodeWorldX = joineeMesh.position.x + nodePos.x
        const nodeWorldY = joineeMesh.position.y + nodePos.y

        // Distance from the pivot

        const distancedWorldX = (nodeWorldX - pivotWorld.x)
        const distancedWorldY = (nodeWorldY - pivotWorld.y)

        // Convert back to local

        nodePos.x = distancedWorldX + joinerNode.x // I don't know why adding this makes it work better
        nodePos.y = distancedWorldY + joinerNode.y

        return nodePos

    })

    // Combine nodes

    const combinedNodes = [
        ...newJoinerNodes,
        ...newJoineeNodes
    ];
    console.log(combinedNodes)

    // Configure new nodes for rendering

    combinedNodes.forEach((n) => {
        // Scrub
        delete n["instance"]

        // For any "used" bonding blocks, change their color
        if (n.node.block.isBonded) {
            n.node.block.color = "green";
        }
    });

    // Clear old organisms before creating new combined one

    clearUpOrganism(joinerInstance)
    clearUpOrganism(joineeInstance)

    // Create the new combined organism in the system

    const combinedOrganism = addOrganism(DNA.placeholderDefaultRootNode);

    // Remove its default mesh from the scene

    ThreeElements.scene.remove(combinedOrganism.mesh);

    // Assign the merged nodePositions & build a new mesh

    combinedOrganism.nodePositions = combinedNodes;
    combinedOrganism.mesh = OrganismBuilder.buildBodyFromNodePositions(
        combinedOrganism.nodePositions
    );
    if (!combinedOrganism.mesh) {
        console.warn(
            "Failed to build combined mesh; probably empty node array.",
            combinedNodes
        );
        return;
    } else {
        console.log("built combined mesh", combinedOrganism)
    }

    // Place the new mesh so that pivot remains at the same world position
    // i.e. pivot is now local (0,0), so put the mesh at pivot's old coords.
    combinedOrganism.mesh.position.set(pivotWorld.x, pivotWorld.y, 0);

    // Add the combined mesh to the scene
    ThreeElements.scene.add(combinedOrganism.mesh);

}

export { addOrganism, setMovementToggle, rebuildAllOrganisms, clearScene, getAllOrganisms, bondOrganisms };