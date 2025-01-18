/*

    Combat Updates

    The system for operating combat mechanics and updating organisms
    in a single combat session update.

*/

import * as ThreeElements from "./game.v0.2.3d";
import * as Organisms from "./game.v0.2.organisms"

// Cache for an update, so to prevent the same things (e.g the
// world positions of nodes) being needlessly recalculated in
// the same update. Is cleared after every combatUpdate
const combatUpdateCache = {
    nodeWorldPositions: {}
}

/*

    Updating an organism with mechanics

*/

// Block mechanics statics
const maxAttractionVelocity = 0.05

function updateOrganismInCombat(organism, opponent) {
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

        // TODO: check block types for block interactions
    }

    /*
        
        Natural attraction to center for "bashing" mechanic

    */

    const orgWorldPos = organism.mesh.position
    const targetWorldPos = { x: 0, y: 0 }

    // Draw organism closer to center

    const worldDist = {
        x: targetWorldPos.x - orgWorldPos.x,
        y: targetWorldPos.y - orgWorldPos.y
    }
    organism.velocity.x = Math.sign(worldDist.x) * maxAttractionVelocity
    organism.velocity.y = Math.sign(worldDist.y) * maxAttractionVelocity
}

/*

    General mechanics utilities

*/

const overlapRadius = 2
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
                ny = 0;
            }

            // Each is pushed back
            const half = (overlap);

            // We push the organism by (nx*half, ny*half) in world space
            ThreeElements.translateMeshInWorld(organism.mesh, nx * half, ny * half);

            // We push the opponent by -(nx*half, ny*half)
            ThreeElements.translateMeshInWorld(opponent.mesh, -nx * half, -ny * half);
        }
    }
}

/*

    Updating everything

*/

// Updates each organism, syncs it with all its opponents
function combatUpdate() {
    // Organisms are changing constantly
    const currentOrganisms = Organisms.getAllOrganisms()

    // Each organism must be updated
    for (const organism of currentOrganisms) {
        // Sync with all opponents
        for (const opponent of currentOrganisms) {
            if (
                // Prevent "fighting with self"
                organism.id !== opponent.id
            ) {
                updateOrganismInCombat(organism, opponent);
            }
        }
    }

    // Clear cache for next update
    combatUpdateCache.nodeWorldPositions = {}
}

export { combatUpdate }