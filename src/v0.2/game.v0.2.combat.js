/*

    Combat

*/

import * as DNA from "./game.v0.2.dna";
import * as Organisms from "./game.v0.2.organisms"
import { cloneObject } from "./game.v0.2.utils";

let liveModeToggle = false;
let combatRunning = false;
let combatLoopCycle;
let combatUpdatesPerTick = 1;

let playerOrganism = null;
let enemyOrganism = null;

// Combat setup

function startCombat() {
    console.log("starting combat...")

    // Set enemy

    const enemyDNA = cloneObject(DNA.demoDnaSequence)
    enemyOrganism = Organisms.addOrganism(
        enemyDNA,
        { x: 15, y: 0 }
    )

    // Start tick updates

    combatLoop()

    combatRunning = true
}

function endCombat() {
    console.log("ending combat...")

    cancelAnimationFrame(combatLoopCycle)
    combatLoopCycle = null

    combatRunning = false
}

function combatLoop() {
    combatLoopCycle = requestAnimationFrame(combatLoop)

    const currentOrganisms = Organisms.getAllOrganisms()

    // Updates per tick = speed of play
    for (let i = 0; i < combatUpdatesPerTick; i++) {
        // Each organism must be updated
        for (const organism of currentOrganisms) {
            // Sync with all opponents
            for (const opponent of currentOrganisms) {
                // Prevent colliding with self
                if (opponent.id !== organism.id) {
                    updateCombat(organism, opponent);
                }
            }
        }
    }
}

function toggleCombat(playerOrganismImport) {
    playerOrganism = playerOrganismImport
    liveModeToggle = !liveModeToggle

    // Start/end 'living' mode
    Organisms.setMovementToggle(liveModeToggle, playerOrganism)

    // Begin/end combat mechanics
    if (liveModeToggle && !combatRunning) {
        startCombat()
    } else {
        endCombat()
    }
}

// Combat mechanics

function updateCombat(organism, opponent) {
    const overlappingNodes = getOverlappingNodes(organism, opponent);
    if (overlappingNodes.length > 0) {
        // Bump them so that none of these overlapping node pairs remain overlapped
        bumpEdges(organism, opponent, overlappingNodes);
    }
}

// Utility

const overlapRadius = 1.5
function getOverlappingNodes(organism, opponent) {
    const organismNodes = organism.nodePositions;    // local coords of organism's nodes
    const opponentNodes = opponent.nodePositions;    // local coords of opponent's nodes

    const result = [];

    // Naive O(N*M) check
    for (const orgNodePos of organismNodes) {
        // Convert local coords to world coords for the organism node
        const orgNodeWorld = {
            x: orgNodePos.x + organism.mesh.position.x,
            y: orgNodePos.y + organism.mesh.position.y
        };
        for (const oppNodePos of opponentNodes) {
            // Convert local coords to world coords for the opponent node
            const oppNodeWorld = {
                x: oppNodePos.x + opponent.mesh.position.x,
                y: oppNodePos.y + opponent.mesh.position.y
            };

            // AABB overlap check (quick & dirty)
            if (
                (orgNodeWorld.x > oppNodeWorld.x - overlapRadius) &&
                (orgNodeWorld.x < oppNodeWorld.x + overlapRadius) &&
                (orgNodeWorld.y > oppNodeWorld.y - overlapRadius) &&
                (orgNodeWorld.y < oppNodeWorld.y + overlapRadius)
            ) {
                result.push({
                    orgNodePos,      // local coords in organism
                    oppNodePos       // local coords in opponent
                });
            }
        }
    }
    return result;
}

function bumpEdges(organism, opponent, overlappingNodes) {
    for (const pair of overlappingNodes) {
        // Convert each node to world coords again
        const orgNodeWorld = {
            x: pair.orgNodePos.x + organism.mesh.position.x,
            y: pair.orgNodePos.y + organism.mesh.position.y
        };
        const oppNodeWorld = {
            x: pair.oppNodePos.x + opponent.mesh.position.x,
            y: pair.oppNodePos.y + opponent.mesh.position.y
        };

        // Do a more accurate circle-based overlap check: 
        // distance < overlapRadius, then push them out
        const dx = orgNodeWorld.x - oppNodeWorld.x;
        const dy = orgNodeWorld.y - oppNodeWorld.y;
        const distSq = dx * dx + dy * dy;
        const minDistSq = overlapRadius * overlapRadius;

        if (distSq < minDistSq) {
            // They overlap
            const dist = Math.sqrt(distSq);
            const overlap = overlapRadius - dist;

            // Direction from opponent node => organism node
            // If dist=0 (exact same coords), offset slightly
            let nx, ny;
            if (dist > 0) {
                nx = dx / dist; // normalized direction x
                ny = dy / dist; // normalized direction y
            } else {
                // Rare exact overlap => pick an arbitrary direction
                nx = 1;
                ny = 0;
            }

            // Push them each half the overlap, 
            // so total separation = overlap
            const half = overlap * 0.5;

            // Move organism mesh outward
            organism.mesh.position.x += nx * half;
            organism.mesh.position.y += ny * half;

            // Move opponent mesh inward
            opponent.mesh.position.x -= nx * half;
            opponent.mesh.position.y -= ny * half;
        }
    }
}

export { toggleCombat }