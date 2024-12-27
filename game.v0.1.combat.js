/*

    Combat

*/

import * as DNA from './game.v0.1.dna.js'
import * as Organisms from './game.v0.1.organisms.js'

function determineCombatAction(organism, enemy) {
    // Default decisions
    let action = {
        movement: "idle", // Can be "chase", "flee", "circle", or "idle"
        attack: false,    // Determines if the organism tries to attack
        energyUsage: "normal", // Can be "low", "normal", or "high"
    };

    // Aggression-based decision
    if (organism.traits.aggression > 50) {
        action.movement = "chase";
        action.attack = true;
    } else {
        action.movement = "flee";
        action.attack = false;
    }

    // Eyes: Adjust distance awareness and reactions
    if (organism.traits.eyes > 3) {
        // Size vs. enemy size: Adjust movement and attack strategy
        if (organism.traits.size > enemy.traits.size) {
            if (organism.traits.spikiness > enemy.traits.spikiness) {
                action.movement = "chase";
                action.attack = true;
            } else {
                action.movement = "flee";
            }
        } else if (organism.traits.size < enemy.traits.size) {
            action.movement = "flee";
            action.attack = false;
        }
    } else if (organism.traits.eyes <= 1) {
        action.movement = "idle"; // Poor vision limits reaction
    }

    // Take advantage of idling or fleeing enemy
    if (
        (enemy.currentStrat == "idle" || enemy.currentStrat == "flee") ||
        (organism.traits.aggression >= 25 && organism.energy >= 25)
    ) {
        action.movement = "chase";
        action.attack = true;
    }

    // If health/energy is low, prioritize fleeing
    if (organism.health < (100 - organism.traits.courage) || organism.energy < (100 - organism.traits.courage)) {
        action.movement = "flee";
        action.attack = false;
        action.energyUsage = "low";
    }

    // Energy usage
    if (action.movement == "chase") {
        action.energyUsage = "high";
    } else {
        action.energyUsage = "low";
    }

    return action;
}

const combatTable = document.getElementById("combat-table")
const combatResult = document.getElementById("combat-result")
const combatResultsTable = document.getElementById("combat-results-table")
const combatWinsDefsTable = document.getElementById("combat-wds-table")
const combatForfeitButton = document.getElementById("forfeit-button")

const playerHealthBar = document.getElementById("player-health")
const playerEnergyBar = document.getElementById("player-energy")
const playerStrat = document.getElementById("player-strat")

const enemyHealthBar = document.getElementById("enemy-health")
const enemyEnergyBar = document.getElementById("enemy-energy")
const enemyStrat = document.getElementById("enemy-strat")

const combatantIds = { player: null, enemy: null }

let combatSeriesContinue = false

let player;
let enemy;
let winningDNA;
let losingDNA;
let combatWinner;
let combatRound;
let combatResults;
function startCombat(playerOrganism) {
    if (enemy) {
        console.error("combat already in session")
        return
    }

    combatWinner = null;

    player = playerOrganism
    player.mesh.position.x = 0;
    combatantIds.player = player.id

    if (winningDNA.length == 0 && losingDNA.length == 0) {
        // Generate "winner" (complement)

        const presets = {
            "edges": 0,
            "move-style": 0,
            "membrane": 0,
            "size": 0,
            "spiky-ness": 0,
            "eyes": 0,
            "gravity resistance": 0,
            "energy-consumption": 0,
            "aggression": 0
        }

        player.dnaSequence.forEach((gene) => {
            if (gene.role.title in presets) {
                let currentSet;
                if ("values" in gene.role) {
                    currentSet = (gene.role.values.length - 1) - gene.current;
                } else {
                    currentSet = 100 - gene.current;
                }
                presets[gene.role.title] = currentSet
            }
        })

        enemy = Organisms.addOrganism(DNA.generateRandomDNASequence(presets))
    } else if (winningDNA.length > 1 && losingDNA.length > 1) {
        // Generate from predictions
        enemy = Organisms.addOrganism(
            DNA.generateFromPrediction(winningDNA, losingDNA)
        )
    } else {
        // Generate random
        enemy = Organisms.addOrganism(
            DNA.generateRandomDNASequence()
        )
    }

    enemy.mesh.position.x = Math.random() >= 0.5 ? -5 : 5;
    enemy.mesh.position.y = 0;
    combatantIds.enemy = enemy.id

    // Set stats
    combatResult.innerHTML = ""

    enemy.health = 100
    enemy.energy = 100

    player.health = 100
    player.energy = 100

    // Stop idle animations
    Organisms.setIdle(false);

    console.log(`Start combat. Player: ${player.id}, Enemy: ${enemy.id}`)
    console.log(player.traits, enemy.traits)

    combatLoop();

    combatTable.style.display = "block"
    combatForfeitButton.style.display = "block"
    combatForfeitButton.onclick = () => {
        endCombat(player.id, "forfeited")
    }
}

let combatLoopCycle;
function combatLoop() {
    combatLoopCycle = requestAnimationFrame(combatLoop)

    playerStrat.innerHTML = player.currentStrat;
    enemyStrat.innerHTML = enemy.currentStrat;

    updateCombat(player, enemy);
    updateCombat(enemy, player);
}

let endingCombat = false
function endCombat(defeatedId, reason) {
    console.log(`Ended combat.`)

    cancelAnimationFrame(combatLoopCycle)
    combatLoopCycle = null

    if (defeatedId == player.id) {
        combatResult.innerHTML = `DEFEATED! Your organism ${reason}!`

        if (reason !== "forfeited") {
            winningDNA.push(enemy.dnaSequence)
            losingDNA.push(player.dnaSequence)
        }

        if (reason == "ran out of energy") {
            combatResults.wasExhausted++
        }
        if (reason == "was beaten") {
            combatResults.wasBeaten++
        }
    } else if (defeatedId == enemy.id) {
        combatResult.innerHTML = `WON! The enemy ${reason}!`

        winningDNA.push(player.dnaSequence)
        losingDNA.push(enemy.dnaSequence)

        if (reason == "ran out of energy") {
            combatResults.exhaustedEnemy++
        }
        if (reason == "was beaten") {
            combatResults.beatEnemy++
        }
    } else {
        combatResult.innerHTML = "STALEMATE! No organism was doing anything."
    }

    const totalWins = combatResults.exhaustedEnemy + combatResults.beatEnemy
    const totalDefeats = combatResults.wasExhausted + combatResults.wasBeaten

    combatWinsDefsTable.innerHTML = `
        <td colspan="2">${totalWins}</td>
        <td colspan="2">${totalDefeats}</td>
    `

    combatResultsTable.innerHTML = ""
    if (totalWins > 0) {
        combatResultsTable.innerHTML += `
            <td>${Math.round((combatResults.exhaustedEnemy / totalWins) * 100)}%</td>
            <td>${Math.round((combatResults.beatEnemy / totalWins) * 100)}%</td>`
    } else {
        combatResultsTable.innerHTML += "<td>0%</td><td>0%</td>"
    }
    if (totalDefeats > 0) {
        combatResultsTable.innerHTML += `
            <td>${Math.round((combatResults.wasExhausted / totalDefeats) * 100)}%</td>
            <td>${Math.round((combatResults.wasBeaten / totalDefeats) * 100)}%</td>`
    } else {
        combatResultsTable.innerHTML += "<td>0%</td><td>0%</td>"
    }

    if (endingCombat || reason == "draw") {
        return
    }

    endingCombat = true

    setTimeout(() => {
        console.log("resetting combat...")

        // Reset enemy
        if (enemy) {
            enemy.remove();
            enemy = null
        }

        // Reset player
        player.createOrganismMesh();
        player.mesh.position.x = 0;
        player.mesh.position.y = 0;
        player.velocity = { x: 0.01, y: 0 };

        if (combatSeriesContinue) {
            combatRound++
            startCombat(player)
        } else {
            Organisms.setIdle(true);

            combatTable.style.display = "none"
            combatResult.innerHTML = ""

            combatForfeitButton.style.display = "none"
            document.getElementById('game-canvas').style.display = "block"
            document.getElementById("combat-button").innerHTML = "START COMBAT"
        }

        endingCombat = false
    }, 2100)
}

function updateCombat(organism, enemy) {
    const action = determineCombatAction(organism, enemy);

    organism.currentStrat = action.movement;

    const organismSpeed = (organism.traits.energyConsumption / 100) * 0.035

    // Adjust velocity based on the action
    if (action.movement === "chase") {
        organism.velocity.x = Math.sign(enemy.mesh.position.x - organism.mesh.position.x) * organismSpeed;
        if (organism.traits.moveStyle !== "legs") {
            organism.velocity.y = Math.sign(enemy.mesh.position.y - organism.mesh.position.y) * organismSpeed;
        }
    } else if (action.movement === "flee") {
        organism.velocity.x = -Math.sign(enemy.mesh.position.x - organism.mesh.position.x) * organismSpeed;
        if (organism.traits.moveStyle !== "legs") {
            organism.velocity.y = -Math.sign(enemy.mesh.position.y - organism.mesh.position.y) * organismSpeed;
        }
    } else {
        organism.velocity.x *= 0.9; // Decelerate when idle
        if (organism.traits.moveStyle !== "legs") {
            organism.velocity.y *= 0.9;
        }
    }

    if (organism.mesh.position.x > 6) {
        organism.velocity.x = -0.02
    }
    if (organism.mesh.position.x < -6) {
        organism.velocity.x = 0.02
    }
    if (organism.traits.moveStyle !== "legs") {
        if (organism.mesh.position.y > 3.5) {
            organism.velocity.y = -0.02
        }
        if (organism.mesh.position.y < -3.5) {
            organism.velocity.y = 0.02
        }
    }

    // Update position based on velocity
    organism.mesh.position.x += organism.velocity.x;
    if (organism.traits.moveStyle !== "legs") {
        organism.mesh.position.y += organism.velocity.y;
    }

    // Leg animation
    if (organism.traits.moveStyle == "legs") {
        organism.mesh.rotation.z -= organism.velocity.x;
    }

    // Hurt when colliding with enemy
    if (checkCollision(organism.mesh, enemy.mesh)) {
        const damage = calculateDamage(organism.traits, enemy.traits);
        enemy.health -= damage;
        enemy.hurt();
    }

    // Energy logic: Decrease energy based on usage
    if (action.movement == "idle") {
        organism.energy -= 0.01;
    } else {
        organism.energy -= (organism.traits.energyConsumption / 100) * ((action.energyUsage == "high") ? 0.25 : 0.125);
    }

    // Check if energy or health is depleted
    const roundedEnergy = Math.floor(organism.energy / 5) * 5
    const roundedHealth = Math.floor(organism.health / 5) * 5

    if (organism.id == player.id) {
        playerHealthBar.value = roundedHealth
        playerEnergyBar.value = roundedEnergy
    } else {
        enemyHealthBar.value = roundedHealth
        enemyEnergyBar.value = roundedEnergy
    }

    if (roundedEnergy <= 0 || roundedHealth <= 0) {
        let reason = "";
        if (roundedEnergy <= 0) {
            reason = "ran out of energy";
        }
        if (roundedHealth <= 0) {
            reason = "was beaten";
        }

        console.log(`${organism.id} is defeated. It ${reason}`);

        organism.explode();

        if (combatWinner == null) {
            endCombat(organism.id, reason);
        } else {
            endCombat(null, "draw");
        }
    }

    // Update membrane outline to match organism's position
    organism.membraneOutline.position.copy(organism.mesh.position);
    organism.membraneOutline.rotation.copy(organism.mesh.rotation);
}

function startStopCombatSeries(playerOrganism) {
    combatSeriesContinue = !combatSeriesContinue
    if (combatSeriesContinue) {
        winningDNA = []
        losingDNA = []

        combatWinsDefsTable.innerHTML = "<td colspan='2'>0</td><td colspan='2'>0</td>"
        combatResultsTable.innerHTML = "<td>0%</td><td>0%</td><td>0%</td><td>0%</td>"
        combatRound = 1
        combatResults = {
            wasExhausted: 0, wasBeaten: 0, exhaustedEnemy: 0, beatEnemy: 0
        }

        startCombat(playerOrganism)
    }
    return combatSeriesContinue
}

// Utility functions
function checkCollision(mesh1, mesh2) {
    try {
        const distance = mesh1.position.distanceTo(mesh2.position);
        const combinedRadii = mesh1.geometry.boundingSphere.radius + mesh2.geometry.boundingSphere.radius;
        return distance <= combinedRadii;
    } catch (e) {
        console.warn("mesh bounding error")
        return false
    }
}

function calculateDamage(attackerTraits, defenderTraits) {
    // Factors for calculating damage
    const spikeFactor = attackerTraits.spikiness; // Spikier organisms deal more damage
    const sizeFactor = attackerTraits.size / 2.5;           // Larger organisms deal more damage
    const membraneFactor = defenderTraits.membrane; // Thicker membranes absorb damage
    const baseDamage = spikeFactor * sizeFactor;      // Base damage is scaled by size and spikiness

    // Final damage inflicted
    // 0.1 means that at least some damage is done, just out of
    // the collision
    return Math.max(0.05, baseDamage - membraneFactor);
}

export { startCombat, startStopCombatSeries }