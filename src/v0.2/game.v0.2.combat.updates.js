/*

    Combat Updates

    The system for operating combat mechanics and updating organisms
    in a single combat session update.

*/

import * as ThreeElements from "./game.v0.2.3d";
import { BLOCK_TYPENAME_ABSORBER, BLOCK_TYPENAME_FOOD, BLOCK_TYPENAME_MOTOR } from "./game.v0.2.blocks";
import { nutritionPerFoodBlock } from "./game.v0.2.food";
import * as Organisms from "./game.v0.2.organisms"
import * as OrganismBuilder from "./game.v0.2.organism.builder"

// Cache for an update, so to prevent the same things (e.g the
// world positions of nodes) being needlessly recalculated in
// the same update. Is cleared after every combatUpdate
const combatUpdateCache = {
    nodeWorldPositions: {}
}

/*

    Updating an organism with mechanics

*/

function updateOrganismInCombat(organism) {

    // If food, just check if it should still be visible

    if (organism.isFood || organism.isPlant) {

        // Reduce blocks while being spent

        const blocksLeft = Math.round(organism.energy / nutritionPerFoodBlock)
        const foodBlockNodes = organism.nodePositions.filter((nodePos) => {
            return nodePos.node.block.typeName == BLOCK_TYPENAME_FOOD
        })
        if (blocksLeft < foodBlockNodes.length) {
            if (foodBlockNodes.length <= 1) {
                // Destroy it

                ThreeElements.scene.remove(organism.mesh)
                Organisms.destroyOrganism(organism)
            } else {
                // Remove a food node

                const foodNodeToRemoveIndex = organism.nodePositions.findIndex((nodePos) => {
                    return nodePos.node.block.typeName == BLOCK_TYPENAME_FOOD
                })
                organism.nodePositions.splice(foodNodeToRemoveIndex, 1);

                const meshPos = organism.mesh.position
                ThreeElements.scene.remove(organism.mesh)

                organism.mesh = OrganismBuilder.buildBodyFromNodePositions(
                    organism.nodePositions,
                    /* allowDetachingParts: */ false,
                    /* formUnionMesh: */ false
                )
                ThreeElements.scene.add(organism.mesh)
                organism.mesh.position.set(meshPos.x, meshPos.y, 0)
            }
        }

        return
    }

    const postUpdateOrganismStatus = {
        alive: true
    }

    // Deplete energy

    // Natural amount
    let energyDepletion = 0.0125 / 100 // "energy" ranges from 0 to 1

    // More nodes = more energy consumed
    energyDepletion /= (Organisms.minNodesWithoutEnergyCon / organism.nodePositions.length)

    // Motor nodes consume more energy
    if (BLOCK_TYPENAME_MOTOR in organism.nodePosByBlockTypeCache) {
        // Num of motor blocks = sum of all the *applied power* from
        // motor blocks. I.e, a motor block only applying half the
        // power technically only counts as half a motor block. This
        // means less energy is consumed if motor blocks are going
        // slower, e.g due to low energy.
        const motorBlocksActualNum = organism.nodePosByBlockTypeCache[BLOCK_TYPENAME_MOTOR].reduce(
            (accumulator, nodePos) => accumulator + nodePos.node.block.appliedPowerPerc,
            0
        );
        energyDepletion /= (
            Organisms.minMotorNodesWithoutEnergyCon
            / motorBlocksActualNum
        )
    }

    // Deplete 'energy'
    organism.energy -= energyDepletion

    // Death check
    postUpdateOrganismStatus.alive = (Math.round(organism.energy * 25) / 25) > 0

    if (!postUpdateOrganismStatus.alive) {
        // Explode!
        if (!organism.hasExploded) {
            organism.explode()
        }
    }

    return postUpdateOrganismStatus
}

/*

    "Syncing" two organisms, i.e checking interactions with each other

*/

function syncOrganismsInCombat(organism, opponent) {
    // Calc world positions of all nodes, if not yet done in this update
    [organism, opponent].forEach((org) => {
        if (!(org.id in combatUpdateCache.nodeWorldPositions)) {
            org.mesh.updateMatrixWorld(true);
            combatUpdateCache.nodeWorldPositions[org.id] = org.nodePositions.map(nodePos => {
                return ThreeElements.convertNodePosIntoWorldPos(nodePos, org.mesh)
            })
        }
    })

    // Get world positions of nodes in the current update
    const organismNodesWorld = combatUpdateCache.nodeWorldPositions[organism.id]
    const opponentNodesWorld = combatUpdateCache.nodeWorldPositions[opponent.id]

    // Check overlapping nodes for bumping and any block functions
    const overlappingNodes = getOverlappingNodes(organismNodesWorld, opponentNodesWorld);
    if (overlappingNodes.length > 0) {
        // Bump them so that none of these overlapping node pairs remain overlapped
        bumpEdges(organism, opponent, overlappingNodes);

        // Check block types for block interactions

        // Food itself cannot have interactions
        if (organism.isFood || organism.isPlant) {
            return
        }

        // Absorb food
        for (const pair of overlappingNodes) {
            if (opponent.isFood || opponent.isPlant) {
                if (
                    pair.orgNodeWorldPos.node.block.typeName == BLOCK_TYPENAME_ABSORBER &&
                    pair.oppNodeWorldPos.node.block.typeName == BLOCK_TYPENAME_FOOD
                ) {
                    if (opponent.energy > 0 && organism.energy < 1) {
                        // Eat an eighth of a food block for however many ticks the
                        // food piece is touching the absorber node
                        const energyAbsorbed = nutritionPerFoodBlock / 8
                        organism.energy += energyAbsorbed
                        opponent.energy -= energyAbsorbed
                    }
                }
            }
        }
    }
}

/*

    General mechanics utilities

*/

const overlapRadius = 25
function getOverlappingNodes(organismNodesWorld, opponentNodesWorld) {
    const result = [];

    // Naive O(N*M) check
    for (const orgNodeWorld of organismNodesWorld) {
        for (const oppNodeWorld of opponentNodesWorld) {
            // AABB overlap check (quick & dirty)
            if (
                (orgNodeWorld.x > oppNodeWorld.x - overlapRadius) &&
                (orgNodeWorld.x < oppNodeWorld.x + overlapRadius) &&
                (orgNodeWorld.y > oppNodeWorld.y - overlapRadius) &&
                (orgNodeWorld.y < oppNodeWorld.y + overlapRadius)
            ) {
                result.push({
                    orgNodeWorldPos: orgNodeWorld,
                    oppNodeWorldPos: oppNodeWorld
                });
            }
        }
    }
    return result;
}

function bumpEdges(organism, opponent, overlappingNodes) {
    for (const pair of overlappingNodes) {
        const orgNode = pair.orgNodeWorldPos;
        const oppNode = pair.oppNodeWorldPos;

        // circle-based overlap check
        const dx = orgNode.x - oppNode.x;
        const dy = orgNode.y - oppNode.y;
        const distSq = dx * dx + dy * dy;
        const minDistSq = overlapRadius * overlapRadius;

        if (distSq < minDistSq) {
            // They overlap
            const dist = Math.sqrt(distSq);
            const overlap = overlapRadius - dist;

            // Normal from oppNode => orgNode
            let nx, ny;
            if (dist > 0) {
                nx = dx / dist;
                ny = dy / dist;
            } else {
                // exact same coords => arbitrary direction
                nx = 1;
                ny = 1;
            }

            // Each is pushed back
            const half = overlap * 0.25;

            // Move organism mesh outward
            organism.mesh.position.x += nx * half;
            organism.mesh.position.y += ny * half;

            // Move opponent mesh inward
            opponent.mesh.position.x -= nx * half;
            opponent.mesh.position.y -= ny * half;
        }
    }
}

/*

    Updating everything

*/

// Updates each organism, syncs it with all its opponents
function combatUpdate() {
    const postUpdateCombatStatus = {
        ended: false, loser: null
    }

    // Organisms are changing constantly
    const currentOrganisms = Organisms.getAllOrganisms()

    // Each organism must be updated
    for (const organism of currentOrganisms) {
        const orgStatus = updateOrganismInCombat(organism)
        if ((!organism.isFood && !organism.isPlant) && !orgStatus.alive) {
            postUpdateCombatStatus.ended = true
            postUpdateCombatStatus.loser = organism.id
            continue
        }
        // Sync with all other organisms
        for (const opponent of currentOrganisms) {
            if (organism.id !== opponent.id) {
                syncOrganismsInCombat(organism, opponent);
            }
        }
    }

    // Clear cache for next update
    combatUpdateCache.nodeWorldPositions = {}

    return postUpdateCombatStatus
}

export { combatUpdate }