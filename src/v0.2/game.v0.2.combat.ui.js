/*

    Combat UI

*/

import { nutritionPerFoodBlock } from "./game.v0.2.food"

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

const healthbarContainer = document.createElement("healthbar-container")
healthbarContainer.isHidden = true

const playerHealthbar = newHealthbar()
playerHealthbar.classList.add("player")
healthbarContainer.appendChild(playerHealthbar)

const enemyHealthbar = newHealthbar()
enemyHealthbar.classList.add("enemy")
healthbarContainer.appendChild(enemyHealthbar)

// Update

function updateElements(combatCache) {
    const currentLevel = combatCache.level
    const pO = currentLevel.playerOrganism
    const eO = currentLevel.enemyOrganism

    // Set healthbars

    // Energy
    if (combatCache.result == pO.id) {
        playerHealthbar.updateWithEnergyValue(0)
    } else {
        playerHealthbar.updateWithEnergyValue(pO.energy)
    }
    if (combatCache.result == eO.id) {
        enemyHealthbar.updateWithEnergyValue(0)
    } else {
        enemyHealthbar.updateWithEnergyValue(eO.energy)
    }

    // Food score
    playerHealthbar.updateWithFoodScore(
        Math.round(pO.totalEnergyAbsorbed / nutritionPerFoodBlock)
    )
    enemyHealthbar.updateWithFoodScore(
        Math.round(eO.totalEnergyAbsorbed / nutritionPerFoodBlock)
    )
}

// Toggle

function toggleVisibility() {
    if (healthbarContainer.isHidden) {
        document.getElementById("game-wrapper").appendChild(healthbarContainer)
        healthbarContainer.isHidden = false
    } else {
        healthbarContainer.remove()
        healthbarContainer.isHidden = true
    }
}

export { updateElements, toggleVisibility }