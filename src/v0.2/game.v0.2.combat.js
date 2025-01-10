/*

    Combat

*/

import * as DNA from "./game.v0.2.dna";
import * as Organisms from "./game.v0.2.organisms"

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

    const enemyDNA = JSON.parse(JSON.stringify(DNA.demoDnaSequence))
    enemyDNA.color = "blue"
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

    const overlappingNodes = getOverlappingNodes(organism, opponent)
    if (overlappingNodes.length > 0) {
        // Debug
        // organism.highlight();
        // opponent.highlight();

        // Bump
        // TODO Fix bounding problem (mesh children not being
        // counted in mesh's bounding box)
        try {
            preventMeshOverlap(organism, opponent);
        } catch (e) { }
    }

}

// Utility

const overlapRadius = 1.5
function getOverlappingNodes(organism, opponent) {
    const organismNodes = organism.nodePositions
    const opponentNodes = opponent.nodePositions

    const result = []

    // TODO: speed up
    for (const orgNodePos of organismNodes) {
        const orgNodeRealPos = {
            x: orgNodePos.x + organism.mesh.position.x,
            y: orgNodePos.y + organism.mesh.position.y
        }
        for (const oppNodePos of opponentNodes) {
            const oppNodeRealPos = {
                x: oppNodePos.x + opponent.mesh.position.x,
                y: oppNodePos.y + opponent.mesh.position.y
            }
            if (
                (orgNodeRealPos.x > oppNodeRealPos.x - overlapRadius)
                &&
                (orgNodeRealPos.x < oppNodeRealPos.x + overlapRadius)
                &&
                (orgNodeRealPos.y > oppNodeRealPos.y - overlapRadius)
                &&
                (orgNodeRealPos.y < oppNodeRealPos.y + overlapRadius)
            ) {
                result.push(
                    {
                        organism: orgNodePos,
                        opponent: oppNodePos
                    }
                )
            }
        }
    }

    return result
}

function preventMeshOverlap(organism, opponent) {
    const mesh1 = organism.mesh;
    const mesh2 = opponent.mesh;

    // Update world transforms
    mesh1.updateMatrixWorld(true);
    mesh2.updateMatrixWorld(true);

    // Get bounding-sphere centers in world space
    const center1 = mesh1.geometry.boundingSphere.center.clone().applyMatrix4(mesh1.matrixWorld);
    const center2 = mesh2.geometry.boundingSphere.center.clone().applyMatrix4(mesh2.matrixWorld);

    if (center1 == null || center2 == null) {
        // Not finished computing yet
        return false;
    }

    // Estimate effective radii (assumes uniform scale for simplicity)
    const scale1 = mesh1.scale.x;
    const scale2 = mesh2.scale.x;
    const radius1 = mesh1.geometry.boundingSphere.radius * scale1;
    const radius2 = mesh2.geometry.boundingSphere.radius * scale2;
    const combinedRadii = (radius1 + radius2) * 0.75;

    // Compute actual distance
    const distVec = center1.clone().sub(center2);
    let distance = distVec.length();

    // If distance == 0, they’re in the exact same spot; give a small nudge
    if (distance === 0) {
        distVec.set(1e-6, 0, 0); // arbitrary tiny offset
        distance = distVec.length();
    }

    // Check overlap
    if (distance < combinedRadii) {
        // They are overlapping. We push them apart so that distance = combinedRadii

        // The amount we need to separate them
        const overlap = combinedRadii - distance;

        // Direction to push mesh1 away from mesh2
        distVec.normalize();

        // For a “fair” push, move each one half the overlap
        // If you want only one mesh to move, shift overlap to one side.
        const halfOverlap = overlap * Math.abs(organism.velocity.x);

        // shift mesh1 outward
        mesh1.position.add(distVec.clone().multiplyScalar(halfOverlap));
        // shift mesh2 inward
        mesh2.position.sub(distVec.clone().multiplyScalar(halfOverlap));

        return true;
    }

    // No overlap => no collision
    return false;
}

export { toggleCombat }