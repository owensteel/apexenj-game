/*

    Main game

*/

import * as DNA from "./game.v0.2.dna";
import * as ThreeElements from "./game.v0.2.3d";
import * as Organisms from "./game.v0.2.organisms"
import * as Combat from "./game.v0.2.combat"

// Setup for the game canvas

const gameCanvas = document.getElementById('game-canvas');
const gameDnaWrapper = document.getElementById("game-dna-wrapper")

// DNA sequence renderer

const currentDNASequence = JSON.parse(JSON.stringify(DNA.demoDnaSequence))
currentDNASequence.color = "red"

const scrollOffset = { x: 0, y: 0, zoom: 1 }

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

    // Node interactions
    el.onclick = () => {
        // Offshoots are for DEFINING, NOT CHAINING
        // i.e an appendage can be defined with a color, but a
        // color cannot be defined further, hence this restriction
        if (node.role == "appendage" || node.role == "root") {
            if (DNA.createNode(node)) {
                renderDnaSequence()
                renderPlayerOrganism()
            }
        } else if (node.role == "color") {
            const newValue = prompt("New color value:")
            if (newValue) {
                node.value = newValue
                renderDnaSequence()
                renderPlayerOrganism()
            }
        }
    }

    return el;
}

function createConnection(parentX, parentY, childX, childY, childNode) {
    const dx = childX - parentX;
    const dy = childY - parentY;
    const length = 50 * scrollOffset.zoom;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    const line = document.createElement('game-dna-node-joiner');
    line.classList.add('connection');

    if (childNode.detach) {
        line.classList.add('detached');
    }

    line.style.width = `${length}px`;
    line.style.left = `${parentX}px`;
    line.style.top = `${parentY}px`;
    line.style.transform = `rotate(${angle}deg)`;

    line.onclick = () => {
        if (!childNode.detach /* since .detach could be null */) {
            childNode.detach = true;
        } else {
            childNode.detach = false;
        }
        renderDnaSequence()
    }

    return line;
}

function renderTree(node, x, y, level = 0, angleStart = -(Math.PI), angleEnd = Math.PI) {

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
    const radius = 50 * scrollOffset.zoom;

    // Place each child
    node.offshoots.forEach((child, idx) => {
        // For multiple children, we subdivide the angle range
        const childAngle = angleStart + angleSlice * (idx + /* branch offset: */ (0.5));

        // Convert polar coords to cartesian
        const childX = x + radius * Math.cos(childAngle);
        const childY = y + radius * Math.sin(childAngle);

        // Draw a line from parent to child
        const lineEl = createConnection(x, y, childX, childY, child);
        gameDnaWrapper.appendChild(lineEl);

        // Recurse for the child
        // Confine each child to its own angle segment
        const subAngleStart = angleStart + angleSlice * idx;
        const subAngleEnd = angleStart + angleSlice * (idx + 1);

        renderTree(child, childX, childY, level + 1, subAngleStart, subAngleEnd);
    });
}

function renderDnaSequence() {
    // Redraw visual

    gameDnaWrapper.innerHTML = ""
    renderTree(
        currentDNASequence,
        (gameDnaWrapper.clientWidth / 2) + scrollOffset.x,
        (gameDnaWrapper.clientHeight / 2) + scrollOffset.y
    );
}

// DNA sequence visual scrolling

const scrollingCursor = {
    down: false,
    startX: 0,
    startY: 0
}
function bindCanvasScrolling() {
    gameDnaWrapper.onmousedown = (e) => {
        scrollingCursor.startX = e.pageX
        scrollingCursor.startY = e.pageY
        scrollingCursor.down = true
    }
    gameDnaWrapper.onmouseup = () => {
        scrollingCursor.down = false
    }
    gameDnaWrapper.onmousemove = (e) => {
        if (scrollingCursor.down) {
            // Capture and add distance from cursor start point
            scrollOffset.x += (e.pageX - scrollingCursor.startX)
            scrollOffset.y += (e.pageY - scrollingCursor.startY)
            // Reset cursor start point
            scrollingCursor.startX = e.pageX
            scrollingCursor.startY = e.pageY
            // Re-render with new scroll offset
            renderDnaSequence()
        }
    }
    const dnaVisualZoomInput = document.getElementById("game-dna-visual-zoom-input")
    dnaVisualZoomInput.onmousemove = () => {
        scrollOffset.zoom = (parseInt(dnaVisualZoomInput.value) * 2) / 100
        renderDnaSequence()
    }
}

// Player organism

let playerOrganism;
function renderPlayerOrganism() {
    console.log("player organism updated")
    if (playerOrganism) {
        playerOrganism.updateTraitsFromDNA(currentDNASequence);
    } else {
        playerOrganism = Organisms.addOrganism(currentDNASequence)
    }
}

// Init

function initMain() {
    // DNA renderer

    gameCanvas.style.width = window.innerWidth
    gameCanvas.style.height = 300

    renderDnaSequence()
    bindCanvasScrolling()

    // 3D renderer

    ThreeElements.renderScene()

    // Init organism stage

    renderPlayerOrganism()

    const combatToggleButton = document.querySelector(".combat-toggle-button")
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
}

export { initMain }