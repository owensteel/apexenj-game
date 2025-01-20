/*

    Combat

    The system for controlling combat sessions.

*/

import * as DNA from "./game.v0.2.dna";
import * as Organisms from "./game.v0.2.organisms"
import * as CombatUpdates from "./game.v0.2.combat.updates"
import * as Utils from "./game.v0.2.utils"
import { stageEdges3D } from "./game.v0.2.3d";

/*

    Combat setup

*/

let liveModeToggle = false;
let combatRunning = false;
let combatTickCycle;

let playerOrganism = null;
let enemyOrganism = null;

// Store any timeouts so we can track and clear them, and
// subsequently prevent them "overshooting" a session
const combatSessionTimeouts = []

// Cache for the entire combat session
const combatSessionCache = {
    originalEnemy: null
}

const maxAttractionVelocity = 0.05

function startCombat() {
    console.log("starting combat...")

    // Set enemy

    const enemyDNA = Utils.cloneObject(
        DNA.demoDnaSequence,
        /* shallow: */ false
        // Must not be shallow or demoDNA
        // will be a reference that may
        // get corrupted
    )
    enemyOrganism = Organisms.addOrganism(
        enemyDNA,
        {
            x: stageEdges3D.top.right.x - 30,
            y: 0
        }
    )
    combatSessionCache.originalEnemy = enemyOrganism

    // Start tick updates

    combatTick()

    // Set session values

    combatRunning = true

    // Start organisms' initial velocity

    playerOrganism.velocity.x = maxAttractionVelocity
    playerOrganism.velocity.y = 0

    enemyOrganism.velocity.x = -maxAttractionVelocity
    enemyOrganism.velocity.y = 0
}

function endCombat() {
    console.log("ending combat...")

    // Stop combat tick loop

    cancelAnimationFrame(combatTickCycle)
    combatTickCycle = null

    // Reset player values

    playerOrganism.velocity.x = 0
    playerOrganism.velocity.y = 0

    // Reset session values

    combatRunning = false

    // Cancel any timeouts

    combatSessionTimeouts.forEach((timeout) => {
        clearTimeout(timeout)
    })

    // Clear combat session cache

    combatSessionCache.originalEnemy = {}
}

function toggleCombat(playerOrganismImport) {
    playerOrganism = playerOrganismImport
    liveModeToggle = !liveModeToggle

    // Begin/end combat session

    if (liveModeToggle && !combatRunning) {
        startCombat()
    } else {
        endCombat()
    }

    // Start/end 'living' mode for individual organisms

    Organisms.setMovementToggle(liveModeToggle, playerOrganism)
}

/*

    Combat ticks loop

*/

// Control TPS for debugging purposes
const combatTicksPerSec = 24

// Updates per tick = speed of play, because a UPT value higher
// than 1 allows updates/movements to "happen between frames"
const combatUpdatesPerTick = 1;

function combatTick() {
    // Delay next tick until TPS fraction has elapsed
    combatSessionTimeouts.push(setTimeout(() => {
        if (combatRunning) {
            combatTickCycle = requestAnimationFrame(combatTick)
        }
    }, (1000 / combatTicksPerSec)))

    // Execute as many updates in this tick as UPT specifies
    for (let i = 0; i < combatUpdatesPerTick; i++) {
        CombatUpdates.combatUpdate()
    }
}

export { toggleCombat }