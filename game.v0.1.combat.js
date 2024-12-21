/*

    Combat

*/

import * as DNA from './game.v0.1.dna.js'

function determineCombatAction(organism, enemy) {
    // Default decisions
    let action = {
        movement: "idle", // Can be "chase", "flee", "circle", or "idle"
        attack: false,    // Determines if the organism tries to attack
        energyUsage: "normal", // Can be "low", "normal", or "high"
    };

    // Aggression-based decision
    if (organism.aggression > 70) {
        action.movement = "chase";
        action.attack = true;
    } else if (organism.aggression > 40) {
        action.movement = "circle";
        action.attack = true;
    } else {
        action.movement = "flee";
        action.attack = false;
    }

    // Adjust energy usage based on energy consumption
    if (organism.energyConsumption > 70) {
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

    // Size vs. enemy size: Adjust movement and attack strategy
    if (organism.size > enemy.size) {
        if (organism.spikiness > enemy.spikiness) {
            action.movement = "chase";
            action.attack = true;
        } else {
            action.movement = "circle";
        }
    } else if (organism.size < enemy.size) {
        action.movement = "flee";
        action.attack = false;
    }

    // Membrane thickness influences defense strategy
    if (organism.membrane > 5) {
        if (organism.aggression > 50) {
            action.movement = "chase";
            action.attack = true;
        } else {
            action.movement = "circle";
        }
    }

    // Eyes: Adjust distance awareness and reactions
    if (organism.eyes > 3) {
        if (distanceToEnemy(organism, enemy) < 5) {
            if (organism.aggression > 50) {
                action.movement = "chase";
                action.attack = true;
            } else {
                action.movement = "flee";
            }
        }
    } else if (organism.eyes <= 1) {
        action.movement = "idle"; // Poor vision limits reaction
    }

    // Gravity resistance influences escape and movement options
    if (organism.gravityResistance === "low") {
        if (action.movement === "flee") {
            action.energyUsage = "high"; // Needs extra energy to escape gravity
        }
    } else if (organism.gravityResistance === "high") {
        if (action.movement === "chase") {
            action.energyUsage = "low"; // Can sustain chase due to gravity resistance
        }
    }

    // Move style influences movement strategy
    if (organism.moveStyle === "legs") {
        if (action.movement === "chase" || action.movement === "flee") {
            action.energyUsage = "high"; // Legs require more energy for dynamic movement
        }
    } else if (organism.moveStyle === "tail") {
        if (action.movement === "circle") {
            action.movement = "swim-around";
        }
    } else if (organism.moveStyle === "float") {
        action.movement = "idle";
        action.energyUsage = "low";
    }

    // Adjust spikiness-based damage multiplier
    if (organism.spikiness > 0.5) {
        if (distanceToEnemy(organism, enemy) < 2) {
            action.attack = true; // High spikiness encourages attacking
        } else {
            action.movement = "circle"; // Maintain a safe distance
        }
    }

    // Aggression and energy interplay
    if (organism.aggression > 50 && organism.energyConsumption > 50) {
        action.attack = true;
        action.energyUsage = "high";
    } else if (organism.energyConsumption < 30) {
        action.energyUsage = "low";
        action.attack = false;
    }

    // Add a randomness factor to simulate unpredictable behavior
    if (Math.random() < 0.1) {
        action.movement = ["chase", "flee", "circle", "idle"][Math.floor(Math.random() * 4)];
        action.attack = Math.random() < 0.5;
    }

    return action;
}

// Utility function to calculate distance to the enemy
function distanceToEnemy(organism, enemy) {
    const dx = organism.position.x - enemy.position.x;
    const dy = organism.position.y - enemy.position.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function startCombat() {
    
}