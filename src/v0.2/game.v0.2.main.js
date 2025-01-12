/*

    Main game

*/

import * as DNA from "./game.v0.2.dna";
import * as ThreeElements from "./game.v0.2.3d";
import * as Organisms from "./game.v0.2.organisms"
import * as Combat from "./game.v0.2.combat"
import { cloneObject } from "./game.v0.2.utils";

// Setup for the game canvas

const gameCanvas = document.getElementById('game-canvas');
const gameDnaWrapper = document.getElementById("game-dna-wrapper")
const gameDnaWrapperToolbar = document.getElementById("game-dna-wrapper-toolbar")

// DNA sequence renderer

const gotoPreviousNodeButton = document.createElement("button");
gotoPreviousNodeButton.id = "game-dna-visual-node-back-button"
gotoPreviousNodeButton.innerHTML = "« BACK"

const dnaSequenceExportButton = document.createElement("button");
dnaSequenceExportButton.innerHTML = "Export Sequence"

const currentDNASequence = cloneObject(DNA.demoDnaSequence)

const sequenceRenderSettings = {
    focusedNode: currentDNASequence,
    previousFocusedNode: [],
    x: 0,
    y: 0
}

function deleteNodeFromSequence(node) {
    // Confirm
    if (
        node.offshoots.length > 0
        &&
        !confirm("Delete this node? This will also delete all of its branches.")
    ) {
        return
    }

    // Waste collection method
    node.toBeRemoved = true;

    // Nodes to be removed will be removed from main DNA
    // sequence object when rendered
    renderDnaSequence()
    renderPlayerOrganism()
}

function focusOnNode(node) {
    sequenceRenderSettings.previousFocusedNode.push(sequenceRenderSettings.focusedNode)
    sequenceRenderSettings.focusedNode = node;
    sequenceRenderSettings.x = 0;
    sequenceRenderSettings.y = 0;
    renderDnaSequence()
}

function createNode(parentNode) {
    if (DNA.createNode(parentNode)) {
        renderDnaSequence()
        renderPlayerOrganism()
    }
}

function createNodeElement(node, x, y, level = 0) {
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
        if (level > 1) {
            // Focus on this node first
            focusOnNode(node)
        } else {
            // Add a node
            if (node.role == "appendage" || node.role == "root") {
                createNode(node)
            }
        }
    }

    return el;
}

function createConnection(parentX, parentY, childX, childY, childNode, radius) {
    const dx = childX - parentX;
    const dy = childY - parentY;
    const length = radius;
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

function renderTree(
    node,
    x,
    y,
    level = 0,
    angleStart = 0,
    angleEnd = -Math.PI
) {
    const levelElementSizePerc = (1 - (level / 5))

    // Create a DOM element for the current node
    const nodeEl = createNodeElement(node, x, y, level);
    const nodeElSize = Math.max(5, (25 * levelElementSizePerc));
    nodeEl.style.width = `${nodeElSize}px`
    nodeEl.style.height = `${nodeElSize}px`
    gameDnaWrapper.appendChild(nodeEl);

    // If there are no offshoots, no need to place children
    if (!node.offshoots || node.offshoots.length === 0) {
        return;
    }

    // Remove any offshoots that require removing
    node.offshoots.forEach((child, idx) => {
        if (child.toBeRemoved) {
            node.offshoots.splice(idx, 1)
        }
    })

    // Render children
    const childCount = node.offshoots.length;
    const angleSlice = (angleEnd - angleStart) / childCount;

    // The distance from parent to child (radius).
    const radius = Math.max(5, (50 * levelElementSizePerc));

    // Place each child
    node.offshoots.forEach((child, idx) => {
        // For multiple children, we subdivide the angle range
        const childAngle = angleStart + angleSlice * (idx + 0.5 /* static value for radial pattern */);

        // Convert polar coords to cartesian
        const childX = x + radius * Math.cos(childAngle);
        const childY = y + radius * Math.sin(childAngle);

        // Draw a line from parent to child
        const lineEl = createConnection(x, y, childX, childY, child, radius);
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
        sequenceRenderSettings.focusedNode,
        (gameDnaWrapper.clientWidth / 2) + sequenceRenderSettings.x,
        (gameDnaWrapper.clientHeight - 50) + sequenceRenderSettings.y
    );

    if (sequenceRenderSettings.previousFocusedNode.length > 0) {
        gotoPreviousNodeButton.style.display = ""
    } else {
        gotoPreviousNodeButton.style.display = "none"
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

gotoPreviousNodeButton.onclick = () => {
    if (sequenceRenderSettings.previousFocusedNode.length > 0) {
        sequenceRenderSettings.focusedNode = sequenceRenderSettings.previousFocusedNode.pop()
        renderDnaSequence()
    }
}

dnaSequenceExportButton.onclick = () => {
    const txtarea = document.createElement("textarea")
    txtarea.value = JSON.stringify(currentDNASequence)
    document.body.appendChild(txtarea);
}

function initMain() {
    // Get DOM elements

    gameCanvas.appendChild(gotoPreviousNodeButton)
    gameDnaWrapperToolbar.appendChild(dnaSequenceExportButton)

    // DNA renderer

    gameCanvas.style.width = window.innerWidth
    gameCanvas.style.height = 300

    renderDnaSequence()

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