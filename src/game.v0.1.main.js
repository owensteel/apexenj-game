/*

    Main game

*/

import * as DNA from './game.v0.1.dna.js'
import * as Organisms from './game.v0.1.organisms.js'
import * as Combat from './game.v0.1.combat.js'

// Setup for the game canvas
const canvas = document.getElementById('game-canvas');
canvas.style.width = 600;
canvas.style.height = 150;

const dnaSequence = DNA.generateRandomDNASequence({
    "move-style": 0,
    "membrane": 10,
    "size": 2,
    "spiky-ness": 10,
    "eyes": 1,
    "gravity resistance": 1,
    "energy-consumption": 4,
    "aggression": 30,
    "courage": 50
})
let playerOrganism = null;

// Draw DNA sequence
const dnaSequenceWrapper = canvas.getElementsByTagName("game-dna-wrapper")[0]
function drawDNASequence() {
    dnaSequenceWrapper.innerHTML = ""

    const geneWidth = canvas.clientWidth / dnaSequence.length;
    dnaSequence.forEach((gene, index) => {
        const fillColor = "values" in gene.role ? Object.values(gene.colorCodes)[gene.current] : gene.colorCodes[gene.current];

        const geneDial = document.createElement("gene-dial")
        geneDial.style.backgroundColor = fillColor;
        geneDial.style.width = geneWidth - 15; // 15px for CSS margins
        geneDial.style.height = geneWidth - 15;
        geneDial.classList.add(gene.role.type)

        geneDial.onclick = () => {
            if ("values" in gene.role) {
                const maxIndex = gene.role.values.length - 1;
                gene.current = (gene.current + 1) % (maxIndex + 1);
            } else {
                gene.current = (gene.current + 10) % 110;
            }
            drawDNASequence();
            console.log(gene);
        }

        dnaSequenceWrapper.appendChild(geneDial)
    });

    if (playerOrganism) {
        playerOrganism.updateTraitsFromDNA(dnaSequence);
        playerOrganism.createOrganismMesh();
    } else {
        playerOrganism = Organisms.addOrganism(dnaSequence);

        window.playerOrganismGlobal = playerOrganism
    }
}

// Initialize canvas
document.addEventListener('DOMContentLoaded', () => {
    drawDNASequence();
});

const combatButton = document.getElementById("combat-button")
let combatSeriesToggle = false
combatButton.onclick = () => {
    combatSeriesToggle = Combat.startStopCombatSeries(playerOrganism)
    if (combatSeriesToggle) {
        canvas.style.display = "none"
        combatButton.innerHTML = "COMBAT SERIES: RUNNING"
    } else {
        combatButton.innerHTML = "COMBAT SERIES: STOPPING..."
    }
}

Organisms.setIdle(true);