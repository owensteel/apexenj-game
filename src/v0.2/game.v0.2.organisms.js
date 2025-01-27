/*

    Organism

    Provides access to the creation and updating of organisms in
    the game scene, both at data and visible Three JS level.

*/

import * as THREE from 'three';
import * as ThreeElements from './game.v0.2.3d.js'
import * as OrganismBuilder from './game.v0.2.organism.builder.js'
import { cloneArray, cloneObject } from './game.v0.2.utils.js';
import * as DNA from './game.v0.2.dna.js';
import * as Blocks from './game.v0.2.blocks.js';

// Global variables for setup

const organisms = [];
const defaultCombatStartPos = {
    x: 0,
    y: -ThreeElements.stageEdges3D.top.left.y * 0.5
}

// Provide Brownian-esque motion

const STEP_SIZE = 0.025;
function randomOffset() {
    return (Math.random() * 2 - 1) * STEP_SIZE;
}

// Motion general

const maxXDistInTick = Math.abs(
    ThreeElements.stageEdges3D.top.left.x -
    ThreeElements.stageEdges3D.top.right.x) * 0.025;
const maxYDistInTick = Math.abs(
    ThreeElements.stageEdges3D.top.left.y -
    ThreeElements.stageEdges3D.bottom.left.y) * 0.025;

const minNumOfNodes = 6

// Energy general

const motorMaxPower = 0.1
const minNodesWithoutEnergyCon = 6
const minMotorNodesWithoutEnergyCon = 0.5

/*

    Organism class

*/

class Organism {
    constructor(dnaSequence, combatStartPos = defaultCombatStartPos) {
        // Unique ID for tracking and debugging purposes
        this.id = String(Math.random()).split(".")[1]

        // Unique randomness
        this.random = Math.random()

        // DNA sequence input
        this.dnaSequence = dnaSequence;

        // Energy / "healthbar"
        this.energy = 1

        // Three.Js mesh
        this.mesh = null;

        // Cache node positions for use in combat updates
        this.nodePositions = []

        // Organise nodes by block type for quick access
        this.nodePosByBlockTypeCache = {}

        // Set the organism's starting place in the scene
        this.combatStartPos = combatStartPos

        // Animation utilities
        this.currentAnimations = {}
        this.hasExploded = false
        this.noMovement = false

        // Default velocity
        this.velocity = {
            x: 0,
            y: 0
        };

        // The actual velocity ultimately applied
        this.appliedVelocity = {
            x: 0,
            y: 0
        }

        // Root can never detach (obviously) so prevent such
        // from happening, e.g if this is a recently detached
        // node itself
        if (this.dnaSequence.detach == true) {
            // WARNING: This will permanently corrupt DNA
            // so this is why a child node's sequence must
            // be cloned before being used
            this.dnaSequence.detach = false
        }

        // Build initial mesh
        this.rebuildMesh();
    }

    // Update the DNA sequence and subsequently update
    // the mesh
    updateTraitsFromDNA(dnaSequence) {
        this.dnaSequence = dnaSequence;
        this.rebuildMesh();
    }

    // Export DNA as a string
    exportDNA() {
        // Start with shallow clone
        const dnaClone = cloneObject(this.dnaSequence, true)

        // Remove circular references
        const removeCircularReferences = (dnaNode) => {
            delete dnaNode["parentNode"]

            dnaNode.edges.forEach((edgeNode) => {
                if (edgeNode) {
                    removeCircularReferences(edgeNode)
                }
            })
        }
        removeCircularReferences(dnaClone)

        // Export as string
        return JSON.stringify(dnaClone)
    }

    // Creates mesh for this organism out of its current
    // DNA sequence (converted into nodes)
    rebuildMesh() {
        // Create mesh for all nodes

        // For combat mode, setup is more complex
        if (movementToggle) {

            // Save positions of (attached) nodes for overlapping
            // detection in combat
            this.nodePositions = OrganismBuilder.generateAbsoluteNodePositions(
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

            if (this.isPlant) {
                // Direct towards the centre
                const directionToFace = Math.atan2(
                    0 - this.mesh.position.x,
                    0 - this.mesh.position.y
                )
                this.mesh.rotation.z = directionToFace
            }

            // Separate detachable parts into individual organisms
            const detachedParts = OrganismBuilder.generateAbsoluteNodePositions(
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

            this.nodePositions = OrganismBuilder.generateAbsoluteNodePositions(
                this.dnaSequence,
                /* allowDetachingParts: */ true
            )

            const newMesh = OrganismBuilder.buildBodyFromNodePositions(
                this.nodePositions,
                /* allowDetachingParts: */ true,
                /* formUnionMesh: */ false
            )
            if (this.mesh) {
                ThreeElements.scene.remove(this.mesh)
                newMesh.rotation.copy(this.mesh.rotation)
            }
            this.mesh = newMesh

            // Center stage during design
            this.mesh.position.set(0, 0, 0)
            this.mesh.rotation.set(0, 0, 0)
        }

        this.updateNodePosByBlockTypeCache()
        this.hasExploded = false

        ThreeElements.scene.add(this.mesh);
    }

    updateNodePosByBlockTypeCache() {
        // Update cache of blocks by type, e.g motor blocks

        // Clear old cache
        this.nodePosByBlockTypeCache = {}

        // Populate new cache
        for (const nodePos of this.nodePositions) {
            const typeName = nodePos.node.block.typeName
            if (!(typeName in this.nodePosByBlockTypeCache)) {
                this.nodePosByBlockTypeCache[typeName] = []
            }
            this.nodePosByBlockTypeCache[typeName].push(nodePos)
        }

        return this.nodePosByBlockTypeCache
    }

    // Provides "visible life" to organism mesh
    updateMovement() {
        if (this.mesh == null || this.isPlant || this.noMovement) {
            return
        }

        // Live animation
        if (movementToggle) {

            // Start with the organism's base velocity:

            this.appliedVelocity.x = this.velocity.x;
            this.appliedVelocity.y = this.velocity.y;

            // Don't apply organism physics to food for
            // convenience reasons

            if (!this.isFood) {

                // Gather motor effects in some combined vector:

                let totalMotorX = 0;
                let totalMotorY = 0;
                let totalPower = 0;  // track combined power

                if (Blocks.BLOCK_TYPENAME_MOTOR in this.nodePosByBlockTypeCache) {
                    // Each motor node modifies the velocity by pushing in a certain direction
                    for (const motorNodePos of this.nodePosByBlockTypeCache[Blocks.BLOCK_TYPENAME_MOTOR]) {
                        // The local angle from organism root => motor node
                        const motorAngle = Math.atan2(motorNodePos.y, motorNodePos.x);

                        // Energy affects motor power
                        const motorPowerByEnergy = motorMaxPower * this.energy
                        motorNodePos.node.block.appliedPowerPerc = motorPowerByEnergy / motorMaxPower

                        // Convert that to a velocity vector:
                        // e.g. each motor pushes outward along (cos(angle), sin(angle)) times power
                        const vx = -(motorPowerByEnergy * Math.cos(motorAngle));
                        const vy = -(motorPowerByEnergy * Math.sin(motorAngle));

                        totalMotorX += vx;
                        totalMotorY += vy;
                        totalPower += motorPowerByEnergy;

                        // Animate the "motor" mesh visually (e.g. spinning some axis)
                        motorNodePos.mesh.rotation.x += vx;

                        // Prevent "twisting"
                        if (Math.abs(motorNodePos.mesh.rotation.x) > (Math.PI * 2)) {
                            motorNodePos.mesh.rotation.x = 0
                        }
                    }
                }

                // Add the total motor effect to the applied velocity

                this.appliedVelocity.x += totalMotorX;
                this.appliedVelocity.y += totalMotorY;

                // Reduce effect of velocity depending on the size of the
                // organism

                const sizeSlowdown = (minNumOfNodes / this.nodePositions.length)
                this.appliedVelocity.x *= sizeSlowdown
                this.appliedVelocity.y *= sizeSlowdown

            }

            // Rotate slightly for natural randomness

            const randomInterval = 750 * (1 + this.random)
            this.mesh.rotation.z += Math.sin(
                (Math.round(Date.now() / randomInterval) * randomInterval) * 2
            ) * 0.00125;

            // Prevent "twisting"
            if (this.mesh.rotation.z > Math.PI * 2) {
                this.mesh.rotation.z = 0
            }

            // Actually apply movement

            this.mesh.position.x += (
                maxXDistInTick *
                (
                    (this.appliedVelocity.x * Math.cos(this.mesh.rotation.z)) -
                    (this.appliedVelocity.y * Math.sin(this.mesh.rotation.z))
                )
            ) + randomOffset()
            this.mesh.position.y += (
                maxYDistInTick *
                (
                    (this.appliedVelocity.x * Math.sin(this.mesh.rotation.z)) +
                    (this.appliedVelocity.y * Math.cos(this.mesh.rotation.z))
                )
            ) + randomOffset()
        }
    }

    // Update node pos world positions
    updateNodePosWorldPositions() {
        if (!this.mesh || this.nodePositions.length < 1) {
            return false
        }

        this.mesh.updateMatrixWorld(true);
        for (const nodePos of this.nodePositions) {
            nodePos.worldPos = ThreeElements.convertNodePosIntoWorldPos(
                nodePos, this.mesh
            )
        }

        return this.nodePositions
    }

    // An effect that visually shows the damage done to an organism
    breakOffNode() {
        if (!this.mesh || this.nodePositions.length < 1) {
            return false
        }

        // Cache original mesh position and rotation
        const meshPos = this.mesh.position
        const meshRot = this.mesh.rotation

        // Remove the most childless node possible

        const getNullEdgesInNode = (a) => {
            return a.edges.filter((nodeEdge) => {
                return nodeEdge == null
            })
        }

        const clonedNPForSorting = cloneArray(this.nodePositions)

        const removedNodePos = clonedNPForSorting.sort((a, b) => {
            return getNullEdgesInNode(b.node).length - getNullEdgesInNode(a.node).length
        })[0]

        if (!removedNodePos) {
            return false
        }

        console.log("removing nodepos...", removedNodePos, removedNodePos.index)

        // Remove the node from the positions by index
        if (this.nodePositions.splice(removedNodePos.index, 1).length < 1) {
            console.warn("failed to delete node pos")
            return false
        }

        const removedNode = cloneObject(removedNodePos.node)

        // Isolate, to get rid of any children the builder may try
        // to "resurrect"
        removedNode.edges = Array(6)
        // Add to scene, like it's "crumbled" off
        const removedNodePosWorld = {
            x: removedNodePos.x + meshPos.x,
            y: removedNodePos.y + meshPos.y
        }
        if ("worldPos" in removedNodePos) {
            removedNodePosWorld.x = removedNodePos.worldPos.x
            removedNodePosWorld.y = removedNodePos.worldPos.y
        }
        const removedNodeAsOrg = addOrganism(
            removedNode,
            {
                x: removedNodePosWorld.x,
                y: removedNodePosWorld.y
            }
        )
        // Motor blocks tend to go crazy alone, so make static
        if (removedNode.block.typeName == Blocks.BLOCK_TYPENAME_MOTOR) {
            removedNodeAsOrg.noMovement = true
        }

        // Rebuild this organism without the removed node
        ThreeElements.scene.remove(this.mesh)

        // Only rebuild if there are any nodes left, otherwise
        // let it remain removed forever
        if (this.nodePositions.length > 0) {
            this.mesh = OrganismBuilder.buildBodyFromNodePositions(
                this.nodePositions,
                /* allowDetachingParts: */ false,
                /* formUnionMesh: */ false
            )

            this.updateNodePosByBlockTypeCache()
            ThreeElements.scene.add(this.mesh)

            this.mesh.position.set(meshPos.x, meshPos.y, 0)
            this.mesh.rotation.set(meshRot.x, meshRot.y, meshRot.z)
        }

        return true
    }

    // Remove organism from scene
    die() {
        this.nodePositions = [] // Prevents a "ghost"
        ThreeElements.scene.remove(this.mesh)
    }

    // Exploding animation, break into pieces and die
    explode() {
        if (this.hasExploded) {
            return
        }

        this.hasExploded = true

        this.updateNodePosWorldPositions()
        while (this.nodePositions.length > 1) {
            this.breakOffNode()
        }

        // Remove what remains of the organism
        this.die()
    }
}

/*

    Animation render loop

*/

// This runs constantly, regardless of combat, so the
// organisms are visibly updated

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

            // Skip if a static thing, like a plant
            if (organism.isPlant) {
                return
            }

            organism.updateMovement()
        });
        ThreeElements.renderScene();
        activeAnimation = requestAnimationFrame(renderFrame);
    }

    renderFrame();
}
animate()

/*

    Organism utilities

*/

// Create and return a new instance of an organism with
// a set DNA sequence

function addOrganism(dnaSequence, combatStartPos = defaultCombatStartPos) {
    const newOrganism = new Organism(dnaSequence, combatStartPos);
    console.log("created organism", newOrganism)
    organisms.push(newOrganism);
    return newOrganism
}

// Update the mesh of every organism in the cache

function rebuildAllOrganisms() {
    organisms.forEach((organism) => {
        organism.rebuildMesh()
    })
}

// Clear the visible presences of organisms from the
// scene

function clearScene() {
    organisms.forEach((organism) => {
        ThreeElements.scene.remove(organism.mesh)
    })
}

// Controls whether the organisms are "alive" or not

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

    // Reset energy
    playerOrganism.energy = 1
}

// Gets all organisms currently cached

function getAllOrganisms() {
    return organisms
}

// Get the root of a node's DNA sequence

function getNodeRoot(node) {
    let nodeRoot = node;
    while (nodeRoot.parentNodePos) {
        nodeRoot = nodeRoot.parentNodePos
    }
    return nodeRoot
}

// Clear organism mesh (visible presence) and node positions ("invisible"
// presence) to prevent it from continuing to exist in any form

function destroyOrganism(instance) {
    instance.nodePositions = [];
    ThreeElements.scene.remove(instance.mesh);
}

// Bond organisms, i.e create a new combined organism by merging their two
// meshes around a pivot
// NOTE: This function has many bugs and is part of the Bonding Block feature,
// which is not in the live game

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

    destroyOrganism(joinerInstance)
    destroyOrganism(joineeInstance)

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

export {
    addOrganism,
    setMovementToggle,
    rebuildAllOrganisms,
    clearScene,
    getAllOrganisms,
    bondOrganisms,
    destroyOrganism,

    minNodesWithoutEnergyCon,
    minMotorNodesWithoutEnergyCon
};