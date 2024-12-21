/*

    Main game

*/

import * as DNA from './game.v0.1.dna.js'
import * as Organisms from './game.v0.1.organisms.js'

// Setup for the game canvas
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 150;

const dnaSequence = DNA.generateRandomDNASequence()
let playerOrganism = null;

// Draw DNA sequence
function drawDNASequence() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const geneWidth = canvas.width / dnaSequence.length;
    dnaSequence.forEach((gene, index) => {
        const x = index * geneWidth;
        const y = 50;

        ctx.fillStyle = "values" in gene.role ? Object.values(gene.colorCodes)[gene.current] : gene.colorCodes[gene.current];

        if (gene.role.type === "system") {
            // Draw square for system genes
            ctx.fillRect(x + 10, y, geneWidth - 20, geneWidth - 20);
        } else if (gene.role.type === "body") {
            // Draw triangle for body genes
            const height = geneWidth - 20;
            ctx.beginPath();
            ctx.moveTo(x + geneWidth / 2, y); // Peak of the triangle
            ctx.lineTo(x + 10, y + height); // Bottom left corner
            ctx.lineTo(x + geneWidth - 10, y + height); // Bottom right corner
            ctx.closePath();
            ctx.fill();
        }
    });

    if (playerOrganism) {
        playerOrganism.updateTraitsFromDNA(dnaSequence);
        playerOrganism.createOrganismMesh();
    } else {
        playerOrganism = Organisms.addOrganism(dnaSequence);
    }

    Organisms.animate();
}

// Cycle gene values on click
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const geneWidth = canvas.width / dnaSequence.length;
    const clickedIndex = Math.floor(x / geneWidth);

    const clickedGene = dnaSequence[clickedIndex];
    if (clickedGene) {
        if ("values" in clickedGene.role) {
            const maxIndex = clickedGene.role.values.length - 1;
            clickedGene.current = (clickedGene.current + 1) % (maxIndex + 1);
        } else {
            clickedGene.current = (clickedGene.current + 10) % 110;
        }
        drawDNASequence();
        console.log(clickedGene);
    }
});

// Initialize canvas
document.addEventListener('DOMContentLoaded', () => {
    drawDNASequence();
});