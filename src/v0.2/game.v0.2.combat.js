/*

    Combat

    The system for controlling combat sessions.

*/

import { ThreeCanvas } from "./game.v0.2.3d";
import * as Organisms from "./game.v0.2.organisms"
import * as CombatUpdates from "./game.v0.2.combat.updates"
import * as OrganismBuilderUI from "./game.v0.2.builder.ui"
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
const combatCache = {
    seriesRunning: false,
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
    fS.className = "food-score"
    hbWrapper.appendChild(fS)

    hbWrapper.updateWithFoodScore = (score) => {
        if (hbWrapper.currentFoodScore !== score) {
            fS.innerHTML = score
            hbWrapper.currentFoodScore = score
        }
    }
    hbWrapper.updateWithFoodScore(0)

    return hbWrapper
}

// Temp solution for debugging
const healthbarContainer = document.createElement("healthbar-container")
healthbarContainer.style.display = "none"
document.getElementById("game-wrapper").appendChild(healthbarContainer)

const playerHealthbar = newHealthbar()
playerHealthbar.classList.add("player")
healthbarContainer.appendChild(playerHealthbar)

const enemyHealthbar = newHealthbar()
enemyHealthbar.classList.add("enemy")
healthbarContainer.appendChild(enemyHealthbar)

/*

    Combat session

*/

function startCombat() {
    console.log("starting combat...")

    // Set session values

    combatCache.result = null
    combatRunning = true

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

    // Hide UI

    healthbarContainer.style.display = "none"
}

function toggleCombat() {
    // Toggle

    combatToggled = !combatToggled

    // Set session

    const currentLevel = combatCache.level

    playerOrganism = currentLevel.playerOrganism
    enemyOrganism = currentLevel.enemyOrganism

    // Start/stop movement

    Organisms.setMovementToggle(combatToggled, playerOrganism)

    // Reset level stage

    combatCache.level.reset()

    // Begin/end combat session

    if (combatToggled) {
        startCombat()
    } else {
        endCombat()
    }

    // Reset UI

    document.getElementsByTagName("game-stage-wrapper")[0]
        .setAttribute("mode", combatToggled ? "combat" : "builder")
    OrganismBuilderUI.toggleVisibility()
}

function combatResult() {
    const currentLevel = combatCache.level
    // Game over screen
    if (combatCache.result == playerOrganism.id) {
        // Player lost
        console.log("player lost!")
    } else {
        // Player won
        console.log("opponent lost! next stage...")
    }
    // Delay so the player can see game over screen
    setTimeout(() => {
        if (combatCache.result == playerOrganism.id) {
            // Player lost so streak is over, end combat series
            toggleCombatSeries(currentLevel)
        } else {
            // Player won, auto-continue with next enemy

            // Stop current combat session (also resets level)
            toggleCombat()

            // Move onto next enemy in the leaderboard
            currentLevel.leaderboardCurrentStage++
            if (currentLevel.leaderboardCurrentStage > currentLevel.leaderboardProgress) {
                // By moving onto this enemy we have now exceeded
                // the initial level of progress
                currentLevel.leaderboardProgress = currentLevel.leaderboardCurrentStage
                console.log("new progress level!")
            }
            if (currentLevel.leaderboardProgress >= currentLevel.leaderboard.length) {
                // No more enemies
                currentLevel.leaderboardCurrentStage = currentLevel.leaderboard.length - 1
                currentLevel.leaderboardProgress = currentLevel.leaderboardCurrentStage
                console.log("All enemies in level leaderboard defeated!")
                // Stop combat series
                toggleCombatSeries(combatCache.level, false)
            } else {
                // Start a new session if progress has not
                // yet been beaten
                if (currentLevel.leaderboardCurrentStage <= currentLevel.leaderboardProgress) {
                    toggleCombat()
                }
            }
        }
    }, 2000)
}

function toggleCombatSeries(combatLevel, toggleCombatSession = true) {
    // Cache toggle state
    combatCache.seriesRunning = !combatCache.seriesRunning
    console.log("combat series", combatCache.seriesRunning ? "started" : "ended")

    // Cache current level
    combatCache.level = combatLevel

    // Reset stage (not progress) to 0 for a new combat series
    if (combatCache.seriesRunning) {
        combatCache.level.leaderboardCurrentStage = 0
    }

    // Start/stop session
    if (toggleCombatSession) {
        toggleCombat()
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
        const postUpdateCombatStatus = CombatUpdates.combatUpdate(combatCache.level)
        if (postUpdateCombatStatus.ended && !combatCache.result) {
            // An organism has been destroyed
            combatCache.result = postUpdateCombatStatus.loser
            console.log("combat ended; result:", combatCache.result)

            combatResult()
        }
    }

    // Set healthbars

    // Energy
    if (combatCache.result == playerOrganism.id) {
        playerHealthbar.updateWithEnergyValue(0)
    } else {
        playerHealthbar.updateWithEnergyValue(playerOrganism.energy)
    }
    if (combatCache.result == enemyOrganism.id) {
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

export { toggleCombatSeries }