/*

    Organism syncing

*/

import { scene } from "./game.v1.3d";
import { BLOCK_TYPENAME_ABSORBER, BLOCK_TYPENAME_DIGESTER, BLOCK_TYPENAME_FOOD, BLOCK_TYPENAME_PLANT } from "./game.v1.blocks";
import DNA from "./game.v1.dna";
import Organism from "./game.v1.organism";
import { ENERGY_PER_FOOD_BLOCK, NODESIZE_DEFAULT } from "./game.v1.references";

// Mechanics utilities

const overlapRadius = 15
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

function bumpNodes(organism, opponent, overlappingNodes) {
    for (const pair of overlappingNodes) {
        const orgNode = pair.orgNodeWorldPos;
        const oppNode = pair.oppNodeWorldPos;

        // Distance calculation
        const dx = orgNode.x - oppNode.x;
        const dy = orgNode.y - oppNode.y;
        const distSq = dx * dx + dy * dy;
        const minDistSq = overlapRadius * overlapRadius;

        if (distSq < minDistSq) {
            // They overlap
            const dist = Math.sqrt(distSq);
            const overlap = overlapRadius - dist;

            // Normalized push direction (opp -> org)
            let nx, ny;
            if (dist > 0) {
                nx = dx / dist;
                ny = dy / dist;
            } else {
                // If exactly overlapping, push in a default direction
                nx = 1;
                ny = 1;
            }

            // Factor in velocity influence
            const orgSpeedSq = organism.velocity.x ** 2 + organism.velocity.y ** 2;
            const oppSpeedSq = opponent.velocity.x ** 2 + opponent.velocity.y ** 2;

            const orgSpeed = Math.sqrt(orgSpeedSq);
            const oppSpeed = Math.sqrt(oppSpeedSq);

            const totalSpeed = orgSpeed + oppSpeed;

            let orgPushFactor = 0.5, oppPushFactor = 0.5;
            if (totalSpeed > 0) {
                // The faster object is affected more by the push
                orgPushFactor = oppSpeed / totalSpeed;
                oppPushFactor = orgSpeed / totalSpeed;
            }

            // Apply movement adjustments
            const pushFactor = overlap * 0.25;
            organism.body.mesh.position.x += nx * pushFactor * orgPushFactor;
            organism.body.mesh.position.y += ny * pushFactor * orgPushFactor;

            opponent.body.mesh.position.x -= nx * pushFactor * oppPushFactor;
            opponent.body.mesh.position.y -= ny * pushFactor * oppPushFactor;
        }
    }
}

// "Syncing" two organisms, i.e checking interactions with each other

function syncOrganisms(organism, opponent) {
    // Get world positions of nodes in the current update
    const organismNodesWorld = organism.body.nodePositions.map((nodePos) => {
        return nodePos.worldPos
    })
    const opponentNodesWorld = opponent.body.nodePositions.map((nodePos) => {
        return nodePos.worldPos
    })

    // Check overlapping nodes for bumping and any block functions
    const overlappingNodes = getOverlappingNodes(organismNodesWorld, opponentNodesWorld);
    if (overlappingNodes.length > 0) {
        // Block functions
        for (const nodePosPair of overlappingNodes) {
            const orgNodePos = nodePosPair.orgNodeWorldPos
            const oppNodePos = nodePosPair.oppNodeWorldPos

            // Eat food
            if (
                orgNodePos.node.block.typeName == BLOCK_TYPENAME_ABSORBER &&
                (
                    oppNodePos.node.block.typeName == BLOCK_TYPENAME_FOOD &&
                    !oppNodePos.localNode.isEaten
                )
            ) {
                // Hides or destroys the Food block, depending on whether it
                // is supposed to respawn or not
                const makeFoodBlockEaten = () => {
                    if (
                        oppNodePos.node.parentNode &&
                        oppNodePos.node.parentNode.block.typeName == BLOCK_TYPENAME_PLANT
                    ) {
                        // Is part of a Plant, so should respawn — thus, don't destroy it,
                        // just hide it and toggle off its accessibility
                        oppNodePos.localNode.isEaten = true
                        oppNodePos.mesh.visible = false
                        oppNodePos.localNode.eatenAt = Date.now()
                    } else {
                        // This is Food that is not part of a Plant but a floating object
                        // That should not respawn
                        // So destroy it forever
                        organism.homePool.removeOrganism(opponent)
                        // Fallback
                        oppNodePos.mesh.visible = false
                        scene.remove(oppNodePos.mesh)
                    }
                }

                // Eat and digest the Food block, if there is a Digester
                const hasConnectedDigester = (node) => {
                    // Check if parent is Digester
                    if (!node.parentNode) {
                        return false
                    }
                    if (node.parentNode.block.typeName == BLOCK_TYPENAME_DIGESTER) {
                        return true
                    } else {
                        // If still an Absorber, try the parent of the parent
                        if (node.block.typeName == BLOCK_TYPENAME_ABSORBER) {
                            return hasConnectedDigester(node.parentNode)
                        } else {
                            // End of chain
                            return false
                        }
                    }
                }
                if (hasConnectedDigester(orgNodePos.node)) {
                    // Energy can overflow once, but anything more is not allowed
                    if (organism.energy < 1) {
                        // Make the Food block "eaten"
                        makeFoodBlockEaten()
                        // Add the energy from this Food to this Organism
                        organism.energy += ENERGY_PER_FOOD_BLOCK
                        organism.ui.ateFood()
                    }
                } else {
                    // If no Digester, then just "pass" the Food through
                    // to any void on the other side of the Absorber

                    // Prevent passing an already-passed floating Food block
                    // We want to allow other organisms to potentially "steal"
                    // Food that is stored in other organisms, so only disallow
                    // this particular organism.
                    // If not implemented, the Absorber will just keep passing
                    // the Food back-and-forth infinitely, which is useless — the
                    // Absorber must be "one-way" for things like "digestion" to
                    // work.
                    if (!organism.absorbedFood.includes(opponent.id)) {
                        // TODO: Improve void-locating
                        const nearestVoid = {
                            x: orgNodePos.x,
                            // Place "inwards"
                            y: orgNodePos.y + (
                                Math.sign(-orgNodePos.y) * (NODESIZE_DEFAULT * 2)
                            )
                        }
                        if (nearestVoid) {
                            const foodBlock = new Organism(
                                new DNA(
                                    "appendage",
                                    BLOCK_TYPENAME_FOOD
                                ),
                                null,
                                organism.homePool
                            )
                            organism.homePool.addOrganism(foodBlock)
                            // Prevent double absorption
                            organism.absorbedFood.push(foodBlock.id)
                            // Place in nearest void (e.g on the other side)
                            foodBlock.body.mesh.position.x = nearestVoid.x
                            foodBlock.body.mesh.position.y = nearestVoid.y

                            // Make the original Food block "eaten"
                            makeFoodBlockEaten()
                        }
                    }
                }

                // If there is no Digester connected to the Absorber, and no
                // void for the Absorber to pass Food into, then the Absorber
                // can do nothing
            }
        }

        // Bump them so that none of these overlapping node pairs remain overlapped
        bumpNodes(organism, opponent, overlappingNodes);
    }
}

export default syncOrganisms