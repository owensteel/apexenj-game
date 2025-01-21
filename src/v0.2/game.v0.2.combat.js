/*

    Combat

    The system for controlling combat sessions.

*/

import { stageEdges3D } from "./game.v0.2.3d";
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
    ecosystem: {}
}

// Food

function foodCheckSpawn() {
    if ((combatSessionCache.food.filter((el) => {
        // Food that hasn't been destroyed
        return el.nodePositions.length > 0
    })).length < 3) {
        const foodInst = Food.createFood()
        combatSessionCache.food.push(foodInst)
    } else {
        // Destroy oldest
        Organisms.destroyOrganism(combatSessionCache.food[0])
    }
}
const secondsUntilFoodStarts = 3
const secondsBetweenFoodSpawn = 10

// Healthbars


const newHealthbar = () => {
    const hb = document.createElement("progress")
    hb.setAttribute("min", 0)
    hb.setAttribute("max", 100)
    return hb
}

// Temp solution for debugging
const healthbarContainer = document.createElement("fieldset")
healthbarContainer.style.display = "none"
document.body.appendChild(healthbarContainer)

const playerHealthbar = newHealthbar()
healthbarContainer.appendChild(playerHealthbar)

const enemyHealthbar = newHealthbar()
healthbarContainer.appendChild(enemyHealthbar)

// Starting velocity, to be directed towards centre
const maxAttractionVelocity = 0.005

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

    // Food

    combatSessionCache.foodEnabled = false
    combatSessionCache.food = []

    // Wait a few seconds before allowing food to
    // spawn in
    combatSessionTimeouts.push(setTimeout(() => {
        foodCheckSpawn()
        combatSessionCache.foodInterval = setInterval(
            foodCheckSpawn,
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
    playerOrganism.velocity.y = Math.random() * maxAttractionVelocity

    enemyOrganism.velocity.x = -maxAttractionVelocity
    enemyOrganism.velocity.y = -playerOrganism.velocity.y

    // Start movement

    Organisms.setMovementToggle(true, playerOrganism)

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
        if (postUpdateCombatStatus.ended) {
            // Player's organism has been destroyed
            // But let player end the combat mode when they want to
        }
    }

    // Set healthbars

    playerHealthbar.value = playerOrganism.energy * 100
    enemyHealthbar.value = enemyOrganism.energy * 100
}

export { toggleCombat }