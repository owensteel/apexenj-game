/*

    Main

    Central setup and execution of the game.

*/

import * as DNA from "./game.v0.2.dna";
import * as DNARenderer from "./game.v0.2.dna.renderer";
import * as Organisms from "./game.v0.2.organisms"
import * as Combat from "./game.v0.2.combat"
import { cloneObject } from "./game.v0.2.utils";

// Temporary combat button
// TODO: remove, debugging only
const combatToggleButton = document.createElement("button");
combatToggleButton.innerHTML = "Start combat"
combatToggleButton.toggleState = false
combatToggleButton.onclick = () => {
    Combat.toggleCombat(playerOrganism)
    if (!combatToggleButton.toggleState) {
        combatToggleButton.toggleState = true
        combatToggleButton.innerHTML = "Stop combat"
    } else {
        combatToggleButton.toggleState = false
        combatToggleButton.innerHTML = "Start combat"
    }
}
document.body.appendChild(combatToggleButton)

// Init all

function init() {
    // Init canvas

    const gameCanvas = document.getElementById('game-canvas');
    gameCanvas.style.width = window.innerWidth
    gameCanvas.style.height = 300

    // Init DNA and player

    const playerOrganism = Organisms.addOrganism(
        cloneObject(DNA.demoDnaSequence)
    )
    DNARenderer.init(playerOrganism)
}

export { init }