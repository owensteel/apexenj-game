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

    // Adjust energy usage based on energy consumption
    if (organism.energyConsumption > 50) {
        action.energyUsage = "high";
    } else if (organism.energyConsumption < 30) {
        action.energyUsage = "low";
    }

    // If health is low, prioritize fleeing
    if (organism.health < 20) {
        action.movement = "flee";
        action.attack = false;
        action.energyUsage = "low";
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

    if (organism.traits.aggression > 50 && (enemy.currentStrat == "idle" || enemy.currentStrat == "flee")) {
        action.movement = "chase";
        action.attack = true;
    }

    // Move style influences movement strategy
    if (organism.traits.moveStyle === "legs") {
        if (action.movement === "chase" || action.movement === "flee") {
            action.energyUsage = "high"; // Legs require more energy for dynamic movement
        }
    }

    // Aggression and energy interplay
    if (organism.traits.aggression > 50 && organism.energyConsumption > 50) {
        action.attack = true;
        action.energyUsage = "high";
    } else if (organism.energyConsumption < 30) {
        action.energyUsage = "low";
        action.attack = false;
    }

    return action;
}

const combatTable = document.getElementById("combat-table")
const combatResult = document.getElementById("combat-result")

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
function startCombat(playerOrganism) {
    if (enemy) {
        console.error("combat already in session")
        return
    }

    enemy = Organisms.addOrganism(
        DNA.generateRandomDNASequence(/* presets = */{
            // Tail or legs only
            "move-style": Math.random() > 0.5 ? 1 : 2,
            // Should put up a fight
            "aggression": 100
        })
    )
    enemy.mesh.position.x = Math.random() >= 0.5 ? -5 : 5;
    enemy.mesh.position.y = 0;
    combatantIds.enemy = enemy.id

    player = playerOrganism
    player.mesh.position.x = 0;
    combatantIds.player = player.id

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
}

let combatLoopCycle;
function combatLoop() {
    combatLoopCycle = requestAnimationFrame(combatLoop)

    playerHealthBar.value = Math.round(player.health / 5) * 5
    playerEnergyBar.value = Math.round(player.energy / 5) * 5
    enemyHealthBar.value = Math.round(enemy.health / 5) * 5
    enemyEnergyBar.value = Math.round(enemy.energy / 5) * 5

    playerStrat.innerHTML = player.currentStrat;
    enemyStrat.innerHTML = enemy.currentStrat;

    updateCombat(player, enemy);
    updateCombat(enemy, player);
}

function endCombat(defeatedId, reason) {
    console.log(`Ended combat.`)

    cancelAnimationFrame(combatLoopCycle)
    combatLoopCycle = null

    if (defeatedId == player.id) {
        combatResult.innerHTML = `DEFEATED! Your organism ${reason}!`
    } else {
        combatResult.innerHTML = `WON! The enemy ${reason}!`
    }

    setTimeout(() => {
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
            startCombat(player)
        } else {
            Organisms.setIdle(true);

            combatTable.style.display = "none"
            combatResult.innerHTML = ""
            document.getElementById("combat-button").innerHTML = "START COMBAT"
        }
    }, 2100)
}

function updateCombat(organism, enemy) {
    const action = determineCombatAction(organism, enemy);

    organism.currentStrat = action.movement;

    const organismSpeed = (organism.traits.energyConsumption / 100) * 0.03

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
    if (checkCollision(organism.mesh, enemy.mesh) && action.attack) {
        const damage = calculateDamage(organism.traits, enemy.traits);
        enemy.health -= damage;
        enemy.hurt();
    }

    // Hurt from colliding with enemy
    if (checkCollision(enemy.mesh, organism.mesh)) {
        const damage = calculateDamage(enemy.traits, organism.traits);
        organism.health -= damage;
        organism.hurt();
    }

    // Energy logic: Decrease energy based on usage
    if (action.movement == "idle") {
        organism.energy -= 0.01;
    } else {
        organism.energy -= (organism.traits.energyConsumption / 100) * 0.2;
    }

    // Check if energy or health is depleted
    if (organism.energy <= 0 || organism.health <= 0) {
        let reason = "";
        if (organism.energy <= 0) {
            reason = "ran out of energy";
        }
        if (organism.health <= 0) {
            reason = "was beaten";
        }

        console.log(`${organism.id} is defeated. It ${reason}`);

        organism.explode();

        endCombat(organism.id, reason);
    }

    // Update membrane outline to match organism's position
    organism.membraneOutline.position.copy(organism.mesh.position);
    organism.membraneOutline.rotation.copy(organism.mesh.rotation);
}

function startStopCombatSeries(playerOrganism) {
    combatSeriesContinue = !combatSeriesContinue
    if (combatSeriesContinue) {
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
    const spikeFactor = attackerTraits.spikiness * 2.5; // Higher spikiness deals more damage
    const membraneFactor = defenderTraits.membrane * 2.5; // Thicker membrane absorbs more damage
    return Math.max(0.05, spikeFactor - membraneFactor);
}

export { startCombat, startStopCombatSeries }