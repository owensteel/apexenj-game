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
    nodeWorldPositions: {},
    attractorTargets: {}
}

/*

    Updating an organism with mechanics

*/

// Block mechanics statics
const enableBondingBlocks = false
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

        // Check block types for block interactions
        for (const nodePair of overlappingNodes) {
            const nodeOrg = nodePair.orgNodeWorldPos.node
            const nodeOpp = nodePair.oppNodeWorldPos.node

            // Bonding
            if (
                enableBondingBlocks &&
                (
                    (nodeOrg.block.typeName == "bonding") ||
                    (nodeOpp.block.typeName == "bonding")
                )
            ) {
                if (!nodeOrg.block.isBonded && !nodeOpp.block.isBonded) {
                    let toJoin, joinedTo;
                    if (nodeOrg.block.typeName == "bonding") {
                        nodeOrg.block.isBonded = true

                        toJoin = nodePair.oppNodeWorldPos
                        toJoin.instance = opponent

                        joinedTo = nodePair.orgNodeWorldPos
                        joinedTo.instance = organism
                    }
                    if (nodeOpp.block.typeName == "bonding") {
                        nodeOpp.block.isBonded = true

                        toJoin = nodePair.orgNodeWorldPos
                        toJoin.instance = organism

                        joinedTo = nodePair.oppNodeWorldPos
                        joinedTo.instance = opponent
                    }
                    // Find join position
                    Organisms.bondOrganisms(
                        toJoin,
                        joinedTo
                    )
                }
            }
        }
    }

    // Process nodes
    organismNodesWorld.forEach(orgNodeWorldPos => {
        /*
        
            Attraction blocks

        */
        if (orgNodeWorldPos.node.block.typeName == "attractor") {
            // Find target

            const thisAttractorBlock = orgNodeWorldPos.node.block

            let targetNodeWorldPos = null

            const getProximityToThisAttractor = (a) => {
                // distance^2 for point
                return (a.x - orgNodeWorldPos.x) ** 2 + (a.y - orgNodeWorldPos.y) ** 2;
            }

            const sortByProximityToThisAttractor = (a, b) => {
                // distance^2 for point a
                const distA = getProximityToThisAttractor(a);
                // distance^2 for point b
                const distB = getProximityToThisAttractor(b);

                // sort ascending by distance^2
                return distA - distB;
            }

            const findAttractorTargetNodeInThisOpp = () => {
                const oppNodesWithMatchingBlocks = opponentNodesWorld.filter(
                    (nP) => {
                        // Find a node with a block that matches targetBlock requirements
                        const nPBlock = nP.node.block
                        for (const key of Object.keys(thisAttractorBlock.targetBlock)) {
                            if (nPBlock[key] !== thisAttractorBlock.targetBlock[key]) {
                                return false
                            }
                        }
                        return true
                    }
                )
                if (oppNodesWithMatchingBlocks.length < 1) {
                    return false
                } else if (oppNodesWithMatchingBlocks.length === 1) {
                    return oppNodesWithMatchingBlocks[0]
                } else {
                    // Find closest target
                    return oppNodesWithMatchingBlocks.sort(sortByProximityToThisAttractor)[0]
                }
            }

            // Check if attractor has ID
            if (!("attractorId" in thisAttractorBlock)) {
                // Give attractor a complex ID
                thisAttractorBlock.attractorId = String(Math.random()).split(".")[1]
            }

            // Check if attractor has target or not
            if (!(thisAttractorBlock.attractorId in combatUpdateCache.attractorTargets)) {
                // Give attractor an initial target in this opponent
                targetNodeWorldPos = findAttractorTargetNodeInThisOpp()
            } else {
                // Attractor already has a target — see if there's a closer one in this opponent
                const existingTarget = combatUpdateCache.attractorTargets[thisAttractorBlock.attractorId]
                const targetInThisOpponent = findAttractorTargetNodeInThisOpp()
                if (
                    targetInThisOpponent !== false &&
                    getProximityToThisAttractor(targetInThisOpponent) < getProximityToThisAttractor(existingTarget)
                ) {
                    // New target is closer, change to this target instead
                    targetNodeWorldPos = findAttractorTargetNodeInThisOpp()
                } else {
                    // Keep existing target
                    targetNodeWorldPos = existingTarget
                }
            }

            if (!targetNodeWorldPos) {
                // Attractor has no target and thus is useless as a node, move onto next node
                return;
            }

            // Update cache
            combatUpdateCache.attractorTargets[thisAttractorBlock.attractorId] = targetNodeWorldPos

            // Draw organism closer to target

            const worldDist = {
                x: targetNodeWorldPos.x - orgNodeWorldPos.x,
                y: targetNodeWorldPos.y - orgNodeWorldPos.y
            }
            organism.velocity.x = Math.sign(worldDist.x) * maxAttractionVelocity
            organism.velocity.y = Math.sign(worldDist.y) * maxAttractionVelocity

            ThreeElements.rotateMeshToTarget(
                organism.mesh,
                orgNodeWorldPos.localNode.x,
                orgNodeWorldPos.localNode.y,
                targetNodeWorldPos.x,
                targetNodeWorldPos.y
            )
        }
    })
}

/*

    General mechanics utilities

*/

const overlapRadius = 1.5
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

            // Each gets half the push, plus its own velocity
            const half = (overlap * 0.5) + (
                (organism.appliedVelocity.x) +
                (opponent.appliedVelocity.x)
            );

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
    combatUpdateCache.attractorTargets = {}
}

export { combatUpdate }