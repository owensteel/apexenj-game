/*

    Combat

    The system for controlling combat sessions.

*/

import { stageEdges3D, ThreeCanvas, ThreeRenderer } from "./game.v0.2.3d";
import * as DNA from "./game.v0.2.dna";
import * as Organisms from "./game.v0.2.organisms"
import * as Food from "./game.v0.2.food"
import * as Ecosystems from "./game.v0.2.ecosystems"
import * as CombatUpdates from "./game.v0.2.combat.updates"
import * as Utils from "./game.v0.2.utils"

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
    foodEnabled: false,
    food: [],
    foodInterval: null,
    ecosystem: {},
    result: null
}

// Food

const secondsUntilFoodStarts = 2.5
const secondsBetweenFoodSpawn = 5

// Healthbars


const newHealthbar = () => {
    const hb = document.createElement("progress")
    hb.setAttribute("min", 0)
    hb.setAttribute("max", 100)

    hb.updateWithEnergyValue = (energy) => {
        hb.value = Math.round((energy * 100) / 5) * 5
        if (hb.value <= 25) {
            hb.className = "alert"
        } else {
            hb.className = ""
        }
    }

    return hb
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

    // Set players

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
            y: stageEdges3D.bottom.right.y * 0.5
        }
    )
    combatSessionCache.originalEnemy = enemyOrganism

    // Food

    combatSessionCache.foodEnabled = false
    combatSessionCache.food = []

    const spawnFood = () => {
        // Don't spawn any more food until the organisms
        // have eaten what exists
        if (combatSessionCache.food.filter((e) => e.isEaten == false).length < 5) {
            combatSessionCache.food.push(Food.createFood())
        }
    }

    // Wait a few seconds before allowing food to
    // spawn in
    combatSessionTimeouts.push(setTimeout(() => {
        spawnFood()
        combatSessionCache.foodInterval = setInterval(
            spawnFood,
            1000 * secondsBetweenFoodSpawn
        )
    }, 1000 * secondsUntilFoodStarts))

    // Ecosystem

    combatSessionCache.ecosystem = new Ecosystems.Ecosystem()

    // Start tick updates

    combatTick()

    // Set session values

    combatRunning = true

    // Start organisms' initial velocity

    playerOrganism.velocity.x = maxAttractionVelocity
    playerOrganism.velocity.y = -maxAttractionVelocity

    enemyOrganism.velocity.x = -maxAttractionVelocity
    enemyOrganism.velocity.y = maxAttractionVelocity

    // Start movement

    Organisms.setMovementToggle(true, playerOrganism)

    playerOrganism.mesh.rotation.z = Math.atan2(
        playerOrganism.combatStartPos.x,
        playerOrganism.combatStartPos.y
    )
    enemyOrganism.mesh.rotation.z = Math.atan2(
        enemyOrganism.combatStartPos.x,
        enemyOrganism.combatStartPos.y
    )

    // Show UI

    healthbarContainer.style.display = "block"
}

function endCombat() {
    console.log("ending combat...")

    // Stop combat loops

    cancelAnimationFrame(combatTickCycle)
    combatTickCycle = null

    clearInterval(combatSessionCache.foodInterval)

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
}

export { toggleCombat }