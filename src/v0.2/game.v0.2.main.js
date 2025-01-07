/*

    Main game

*/

import { demoDnaSequence } from "./game.v0.2.dna";

// Setup for the game canvas
const gameCanvas = document.getElementById('game-canvas');
const gameDnaWrapper = document.getElementById("game-dna-wrapper")
const gameStageWrapper = document.getElementById("game-stage-wrapper")

// DNA sequence

const currentDNASequence = demoDnaSequence

function createNodeElement(node, x, y) {
    const el = document.createElement('game-dna-node');
    el.classList.add('node');
    el.classList.add(node.role);

    // If this node has a "value" (e.g. color), apply styling
    if (node.value) {
        el.classList.add('color-node');
        el.style.backgroundColor = node.value;
    }

    // Position the node with global coords
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    return el;
}

function createConnection(parentX, parentY, childX, childY) {
    const dx = childX - parentX;
    const dy = childY - parentY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    const line = document.createElement('game-dna-node-joiner');
    line.classList.add('connection');
    line.style.width = `${length}px`;
    line.style.left = `${parentX}px`;
    line.style.top = `${parentY}px`;
    line.style.transform = `rotate(${angle}deg)`;

    return line;
}

function renderTree(node, x, y, level = 0, angleStart = 0, angleEnd = 2 * Math.PI) {

    // Create a DOM element for the current node
    const nodeEl = createNodeElement(node, x, y);
    gameDnaWrapper.appendChild(nodeEl);

    // If there are no offshoots, no need to place children
    if (!node.offshoots || node.offshoots.length === 0) {
        return;
    }

    const childCount = node.offshoots.length;
    const angleSlice = (angleEnd - angleStart) / childCount;

    // The distance from parent to child (radius).
    const radius = 50;

    // Place each child
    node.offshoots.forEach((child, idx) => {
        // For multiple children, we subdivide the angle range
        const childAngle = angleStart + angleSlice * (idx + 0.5);

        // Convert polar coords to cartesian
        const childX = x + radius * Math.cos(childAngle);
        const childY = y + radius * Math.sin(childAngle);

        // Draw a line from parent to child
        const lineEl = createConnection(x, y, childX, childY);
        gameDnaWrapper.appendChild(lineEl);

        // Recurse for the child
        // Confine each child to its own angle segment
        const subAngleStart = angleStart + angleSlice * idx;
        const subAngleEnd = angleStart + angleSlice * (idx + 1);

        renderTree(child, childX, childY, level + 1, subAngleStart, subAngleEnd);
    });
}

function renderDnaSequence() {
    gameDnaWrapper.innerHTML = ""
    renderTree(currentDNASequence, gameDnaWrapper.clientWidth / 2, gameDnaWrapper.clientHeight / 2);
}

// Initialize
function initMain() {

    gameCanvas.style.width = window.innerWidth
    gameCanvas.style.height = 300

    renderDnaSequence()
}

export { initMain }