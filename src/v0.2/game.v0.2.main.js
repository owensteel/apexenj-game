/*

    Main game

*/

import * as DNA from "./game.v0.2.dna";
import * as ThreeElements from "./game.v0.2.3d";
import * as Organisms from "./game.v0.2.organisms"
import * as Combat from "./game.v0.2.combat"
import { cloneObject, getGlobalBoundingBoxOfHTMLElement } from "./game.v0.2.utils";
import * as Blocks from "./game.v0.2.blocks";

// Setup for the game canvas

const gameCanvas = document.getElementById('game-canvas');
const gameDnaWrapper = document.getElementById("game-dna-wrapper")
const gameDnaWrapperToolbar = document.getElementById("game-dna-wrapper-toolbar")

// Globally-used elements

const gotoPreviousNodeButton = document.createElement("button");
gotoPreviousNodeButton.id = "game-dna-visual-node-back-button"
gotoPreviousNodeButton.innerHTML = "« BACK"

const dnaSequenceExportButton = document.createElement("button");
dnaSequenceExportButton.innerHTML = "Export Sequence"

const nodeBin = document.createElement("game-node-bin")

// DNA sequence renderer

const currentDNASequence = cloneObject(DNA.demoDnaSequence)

const sequenceRenderSettings = {
    focusedNode: currentDNASequence,
    previousFocusedNode: [],
    x: 0,
    y: 0
}

// Node manipulating

let selectedBlockType = "default"

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

function createNode(parentNode) {
    const createdNode = DNA.createNode(parentNode)
    if (createdNode) {
        // Set node block
        if (selectedBlockType !== "default") {
            switch (selectedBlockType) {
                case "bonding":
                    createdNode.block = new Blocks.BondingBlock()
                    break
                case "motor":
                    createdNode.block = new Blocks.MotorBlock()
                    break
            }
        }

        renderDnaSequence()
        renderPlayerOrganism()
    }
    return createdNode
}

// Node map visual

function focusOnNode(node) {
    sequenceRenderSettings.previousFocusedNode.push(sequenceRenderSettings.focusedNode)
    sequenceRenderSettings.focusedNode = node;
    sequenceRenderSettings.x = 0;
    sequenceRenderSettings.y = 0;
    renderDnaSequence()
}

// Node dragging

const nodeDragging = {
    currentNode: null
}

let binBoundingBox = null
const isInBin = (x, y) => {
    return (
        x > binBoundingBox.left && y > binBoundingBox.top
    )
}

const nodeDraggingOverlay = document.createElement("game-node-dragging-overlay")
gameCanvas.appendChild(nodeBin)

nodeDraggingOverlay.onmousemove = (e) => {
    if (nodeDragging.currentNode) {
        // Highlight bin on hover
        if (isInBin(e.pageX, e.pageY)) {
            nodeBin.style.transform = "scale(2)"
        } else {
            nodeBin.style.transform = "scale(1)"
        }

        // Render drag visuals
        nodeDraggingOverlay.innerHTML = ""
        renderTree(
            nodeDragging.currentNode,
            nodeDraggingOverlay,
            e.pageX,
            e.pageY
        )
    }
}
nodeDraggingOverlay.onmouseup = (e) => {
    if (nodeDragging.currentNode) {
        // Check if user has put node in the bin
        if (isInBin(e.pageX, e.pageY)) {
            deleteNodeFromSequence(nodeDragging.currentNode)
        }

        // Remove drag visuals
        nodeBin.style.transform = "scale(1)"
        nodeDraggingOverlay.remove()
        nodeDraggingOverlay.innerHTML = ""

        // Reset node tree to original state
        delete nodeDragging.currentNode["beingDragged"]
        nodeDragging.currentNode = null
        renderDnaSequence()
    }
}

function startDraggingNode(node, e) {
    // Setup bin
    binBoundingBox = getGlobalBoundingBoxOfHTMLElement(nodeBin)

    node.beingDragged = true
    nodeDragging.currentNode = node

    // Re-render main sequence so this node has
    // appears "removed"
    renderDnaSequence()

    // Initial render of dragged object
    gameCanvas.appendChild(nodeDraggingOverlay)
    renderTree(
        nodeDragging.currentNode,
        nodeDraggingOverlay,
        e.pageX,
        e.pageY
    )
}

function createNodeElement(node, x, y, level = 0) {
    const el = document.createElement('game-dna-node');
    el.classList.add('node');
    el.style.backgroundColor = node.block.color;

    // Position the node with global coords
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    // Node interactions

    if (nodeDragging.currentNode == null) {

        // Sub-tree dragging ability
        if (node.role !== "root") {

            let isMouseDownOnNodeEl = false
            el.onmousedown = (e) => {
                isMouseDownOnNodeEl = true
                setTimeout(() => {
                    if (isMouseDownOnNodeEl) {
                        startDraggingNode(node, e)
                    }
                }, 250)
            }
            el.onmouseup = () => {
                isMouseDownOnNodeEl = false
            }

        }

        // Click to add a branch
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
    htmlContainer,
    x,
    y,
    level = 0,
    angleStart = 0,
    angleEnd = -Math.PI
) {
    // Skip nodes currently being dragged
    if (node.beingDragged && htmlContainer.tagName !== nodeDraggingOverlay.tagName) {
        return;
    }

    // Size of node decreases with distance for graphical purposes
    const levelElementSizePerc = (1 - (level / 5))

    // Create a DOM element for the current node
    const nodeEl = createNodeElement(node, x, y, level);
    const nodeElSize = Math.max(5, (25 * levelElementSizePerc));
    nodeEl.style.width = `${nodeElSize}px`
    nodeEl.style.height = `${nodeElSize}px`
    htmlContainer.appendChild(nodeEl);

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
        htmlContainer.appendChild(lineEl);

        // Recurse for the child
        // Confine each child to its own angle segment
        const subAngleStart = angleStart + angleSlice * idx;
        const subAngleEnd = angleStart + angleSlice * (idx + 1);

        renderTree(child, htmlContainer, childX, childY, level + 1, subAngleStart, subAngleEnd);
    });
}

function renderDnaSequence() {
    // Redraw visual

    gameDnaWrapper.innerHTML = ""
    renderTree(
        sequenceRenderSettings.focusedNode,
        gameDnaWrapper,
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
    if (playerOrganism) {
        playerOrganism.updateTraitsFromDNA(currentDNASequence);
    } else {
        playerOrganism = Organisms.addOrganism(currentDNASequence)
    }
}

// Node toolbar

function setNodeToolbar() {
    // TODO: proper node type selector

    const nodeBlockSelector = document.createElement("select")
    gameDnaWrapperToolbar.appendChild(nodeBlockSelector)

    Blocks.PlayerAccessibleBlockTypeNamesList.forEach((BlockType) => {
        const nodeBlockSelectorOption = document.createElement("option")
        nodeBlockSelectorOption.innerText = BlockType
        nodeBlockSelector.appendChild(nodeBlockSelectorOption)
    })

    nodeBlockSelector.onchange = () => {
        selectedBlockType = nodeBlockSelector.value
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

    // Set node toolbar

    setNodeToolbar()
}

export { initMain }