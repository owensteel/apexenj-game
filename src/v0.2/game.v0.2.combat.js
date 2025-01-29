/*

    Combat

    The system for controlling combat sessions.

*/

import { stageEdges3D, ThreeCanvas, ThreeRenderer } from "./game.v0.2.3d";
import * as DNA from "./game.v0.2.dna";
import * as Organisms from "./game.v0.2.organisms"
import * as Levels from "./game.v0.2.levels"
import * as CombatUpdates from "./game.v0.2.combat.updates"
import * as Utils from "./game.v0.2.utils"
import { nutritionPerFoodBlock } from "./game.v0.2.food";

/*

    Combat setup

*/

let combatToggled = false;
let combatRunning = false;
let combatTickCycle;

let playerOrganism = null;
let enemyOrganism = null;

// Store any timeouts so we can track and clear them, and
// subsequently prevent them "overshooting" a session
const combatSessionTimeouts = []

// Cache for the entire combat session
const combatSessionCache = {
    originalEnemy: null,
    level: null,
    result: null
}

// Healthbars


const newHealthbar = () => {
    const hbWrapper = document.createElement("healthbar-wrapper")

    const hb = document.createElement("progress")
    hb.setAttribute("min", 0)
    hb.setAttribute("max", 100)
    hbWrapper.appendChild(hb)

    hbWrapper.updateWithEnergyValue = (energy) => {
        hb.value = Math.round((energy * 100) / 5) * 5
        if (hb.value <= 25) {
            hb.className = "alert"
        } else {
            hb.className = ""
        }
        hbWrapper.currentEnergyValue = energy
    }
    hbWrapper.updateWithEnergyValue(0)

    const fS = document.createElement("p")
    fS.style.color = "purple"
    hbWrapper.appendChild(fS)

    hbWrapper.updateWithFoodScore = (score) => {
        fS.innerHTML = score
        hbWrapper.currentFoodScore = score
    }
    hbWrapper.updateWithFoodScore(0)

    return hbWrapper
}

// Temp solution for debugging
const healthbarContainer = document.createElement("healthbar-container")
healthbarContainer.style.display = "none"
document.getElementById("game-wrapper").appendChild(healthbarContainer)

const playerHealthbar = newHealthbar()
healthbarContainer.appendChild(playerHealthbar)

const enemyHealthbar = newHealthbar()
healthbarContainer.appendChild(enemyHealthbar)

// Starting velocity, to be directed towards centre
const maxAttractionVelocity = 0.005

function startCombat() {
    console.log("starting combat...")

    // Init players

    const enemyDNA = Utils.cloneObject(playerOrganism.dnaSequence)
    enemyOrganism = Organisms.addOrganism(
        enemyDNA,
        {
            x: 0,
            y: stageEdges3D.top.right.y * 0.75
        }
    )
    combatSessionCache.originalEnemy = enemyOrganism

    // Level

    combatSessionCache.level = new Levels.Level()

    // Set session values

    combatSessionCache.result = null
    combatRunning = true

    // Start movement

    Organisms.setMovementToggle(true, playerOrganism)

    // Set player positions and variables

    playerOrganism.totalEnergyAbsorbed = 0
    enemyOrganism.totalEnergyAbsorbed = 0

    playerOrganism.energy = 0.75
    enemyOrganism.energy = 0.75

    playerOrganism.mesh.rotation.z = Math.atan2(
        playerOrganism.combatStartPos.x,
        -playerOrganism.combatStartPos.y
    )
    enemyOrganism.mesh.rotation.z = Math.atan2(
        enemyOrganism.combatStartPos.x,
        -enemyOrganism.combatStartPos.y
    )

    // Show UI

    healthbarContainer.style.display = "block"

    // Start tick updates

    combatTick()
}

function endCombat() {
    console.log("ending combat...")

    // Stop combat loops

    cancelAnimationFrame(combatTickCycle)
    combatTickCycle = null

    // Reset player values

    playerOrganism.velocity.x = 0
    playerOrganism.velocity.y = 0

    // Reset session values

    combatRunning = false

    // Reset canvas

    ThreeCanvas.style.backgroundColor = ""

    // Cancel any timeouts

    combatSessionTimeouts.forEach((timeout) => {
        clearTimeout(timeout)
    })

    // Stop movement

    Organisms.setMovementToggle(false, playerOrganism)

    // Hide UI

    healthbarContainer.style.display = "none"
}

function toggleCombat(playerOrganismImport) {
    playerOrganism = playerOrganismImport

    // Begin/end combat session

    if (!combatToggled) {
        combatToggled = true
        startCombat()
    } else {
        combatToggled = false
        endCombat()
    }
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

    // Execute as many updates in this tick as UPT specifies, until
    // end of combat is reached
    for (let i = 0; i < combatUpdatesPerTick; i++) {
        const postUpdateCombatStatus = CombatUpdates.combatUpdate()
        if (postUpdateCombatStatus.ended && !combatSessionCache.result) {
            // Player's organism has been destroyed
            // But let player end the combat mode when they want to
            combatSessionCache.result = postUpdateCombatStatus.loser
            console.log("combat ended; result:", combatSessionCache.result)
        }
    }

    // Set healthbars

    // Energy
    if (combatSessionCache.result == playerOrganism.id) {
        playerHealthbar.updateWithEnergyValue(0)
    } else {
        playerHealthbar.updateWithEnergyValue(playerOrganism.energy)
    }
    if (combatSessionCache.result == enemyOrganism.id) {
        enemyHealthbar.updateWithEnergyValue(0)
    } else {
        enemyHealthbar.updateWithEnergyValue(enemyOrganism.energy)
    }

    // Food score
    playerHealthbar.updateWithFoodScore(
        Math.round(playerOrganism.totalEnergyAbsorbed / nutritionPerFoodBlock)
    )
    enemyHealthbar.updateWithFoodScore(
        Math.round(enemyOrganism.totalEnergyAbsorbed / nutritionPerFoodBlock)
    )
}

export { toggleCombat }