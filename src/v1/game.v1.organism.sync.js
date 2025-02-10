/*

    Organism syncing

*/

import { BLOCK_TYPENAME_ABSORBER, BLOCK_TYPENAME_DIGESTER, BLOCK_TYPENAME_FOOD } from "./game.v1.blocks";
import { ENERGY_PER_FOOD_BLOCK } from "./game.v1.references";

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
                if (organism.energy < 1) {
                    // Eat the Food block
                    if (orgNodePos.node.parentNode.block.typeName == BLOCK_TYPENAME_DIGESTER) {
                        // Only gain nutrition if it's digested
                        organism.energy += ENERGY_PER_FOOD_BLOCK

                        // Make the Food block "eaten"
                        oppNodePos.localNode.isEaten = true
                        oppNodePos.mesh.visible = false
                    }

                    // Reset interval
                    oppNodePos.localNode.eatenAt = Date.now()
                }
            }
        }

        // Bump them so that none of these overlapping node pairs remain overlapped
        bumpNodes(organism, opponent, overlappingNodes);
    }
}

export default syncOrganisms