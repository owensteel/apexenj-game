/*

    DNA renderer

    Provides visual representation (in node-form) of a given DNA sequence.

*/

import * as ThreeElements from "./game.v0.2.3d";
import * as DNA from "./game.v0.2.dna";
import * as Organisms from "./game.v0.2.organisms"
import * as OrganismBuilder from "./game.v0.2.organism.builder"
import * as Blocks from "./game.v0.2.blocks";
import { getGlobalBoundingBoxOfHTMLElement } from "./game.v0.2.utils";

// Hexagons

const hexGrid = {
    side: 11.25,
    hexPositions: [],
    hexTable: {},
    image: null
}

function generateHexagonGrid() {
    // Clear cache
    hexGrid.hexPositions = []
    hexGrid.hexTable = {}

    // Use same dimensions as wrapper
    const gameWrapper = document.getElementById('game-wrapper')

    // Grab the canvas and its 2D context
    const canvas = document.createElement("canvas");
    canvas.width = gameWrapper.clientWidth
    canvas.height = gameWrapper.clientHeight
    const ctx = canvas.getContext("2d");

    // Side length of each hex
    const side = hexGrid.side;

    // For flat-topped hexes:
    // - The 'width' of each hex is 2 * side
    // - The vertical distance between columns is sqrt(3) * side
    // - The horizontal distance between centres of adjacent columns is 1.5 * side
    const columns = Math.ceil(gameWrapper.clientWidth / (side)) + 5;
    const rows = Math.ceil(gameWrapper.clientHeight / (side)) + 5;
    const horizontalSpacing = 1.5 * side;       // gap between columns
    const verticalSpacing = Math.sqrt(3) * side; // gap between rows

    // A helper to compute the UNSHIFTED local x/y for a given col/row
    function getLocalCoords(col, row) {
        // Odd-q layout: offset half a row on odd columns
        const verticalOffset = col % 2 ? verticalSpacing / 2 : 0;
        // “Local” means no attempt yet to centre on screen
        const localX = col * horizontalSpacing + side;
        const localY = row * verticalSpacing + verticalOffset + side;
        return [localX, localY];
    }

    // Decide which cell to treat as the "centre"
    // e.g. the middle of all possible columns/rows
    const centreCol = Math.floor(columns / 2);
    const centreRow = Math.floor(rows / 2);

    // Compute that cell’s local x,y
    const [centreLocalX, centreLocalY] = getLocalCoords(centreCol, centreRow);

    // Canvas centre
    const halfWidth = canvas.width / 2;
    const halfHeight = canvas.height / 2;

    // Draw a single flat-topped hex at (cx, cy)
    function drawHexagon(cx, cy) {
        ctx.beginPath();
        // For flat-topped: angles 0°, 60°, 120°, 180°, 240°, 300°
        for (let i = 0; i < 6; i++) {
            const angleDeg = 60 * i; // degrees
            const angleRad = (Math.PI / 180) * angleDeg;
            const x = (cx + side * Math.cos(angleRad));
            const y = (cy + side * Math.sin(angleRad));
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();

        // Fill + stroke
        ctx.fillStyle = "transparent";
        ctx.fill();
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Save
        const hexPos = {
            x: cx,
            y: cy
        }
        hexGrid.hexPositions.push(hexPos)

        return hexPos
    }

    // Loop through each column and row
    for (let col = 0; col < columns; col++) {
        for (let row = 0; row < rows; row++) {
            // Get the unshifted local coords
            const [localX, localY] = getLocalCoords(col, row);

            // Translate so that the chosen centre cell is on canvas centre
            const finalX = localX - centreLocalX + halfWidth;
            const finalY = localY - centreLocalY + halfHeight;

            // Draw the hex
            const hexPos = drawHexagon(finalX, finalY);
            hexPos.col = col
            hexPos.row = row

            // Save in table
            const hexKey = `${col},${row}`;
            hexGrid.hexTable[hexKey] = hexPos;
        }
    }

    // Cache neighbours for each hexagon
    for (let col = 0; col < columns; col++) {
        for (let row = 0; row < rows; row++) {
            const hexKey = `${col},${row}`;
            const hex = hexGrid.hexTable[hexKey];
            if (hex) {
                const neighbourPositions = getHexNeighbours(col, row, columns, rows);
                hex.neighbours = neighbourPositions.map(
                    // Save neighbour as hexKey
                    ({ col: nCol, row: nRow }) => `${nCol},${nRow}`
                );
            }
        }
    }

    // Export grid as image
    hexGrid.image = canvas.toDataURL()
}

// For columns that are even:
const neighbourOffsetsEven = [
    // 1 (top)
    { dc: 0, dr: -1 },
    // 2 (top left)
    { dc: -1, dr: -1 },
    // 3 (bottom left)
    { dc: -1, dr: 0 },
    // 4 (bottom)
    { dc: 0, dr: 1 },
    // 5 (bottom right)
    { dc: +1, dr: 0 },
    // 6 (top right)
    { dc: +1, dr: -1 },
];

// For columns that are odd:
const neighbourOffsetsOdd = [
    // 1 (top)
    { dc: 0, dr: -1 },
    // 2 (top left)
    { dc: -1, dr: 0 },
    // 3 (bottom left)
    { dc: -1, dr: +1 },
    // 4 (bottom)
    { dc: 0, dr: +1 },
    // 5 (bottom right)
    { dc: +1, dr: +1 },
    // 6 (top right)
    { dc: +1, dr: 0 },
];

function getHexNeighbours(col, row, columns, rows) {
    // Determine if col is odd or even:
    const isColOdd = (col % 2) === 1;

    const offsets = isColOdd ? neighbourOffsetsOdd : neighbourOffsetsEven;

    // Build the array of valid neighbours
    const neighbours = [];
    offsets.forEach(({ dc, dr }) => {
        const nCol = col + dc;
        const nRow = row + dr;
        if (nCol >= 0 && nCol < columns && nRow >= 0 && nRow < rows) {
            neighbours.push({ col: nCol, row: nRow });
        }
    });

    return neighbours;
}

const hexConnectingEdgeMap = {
    1: 4,
    2: 5,
    3: 6,
    4: 1,
    5: 2,
    6: 3
}

// DNA sequence to be initialized

let currentDNASequence = null
let focusedOrganism = null

// Setup for globally-used DOM elements

const builderWrapper = document.createElement("game-builder-wrapper")
builderWrapper.isHidden = true

const builderClickField = document.createElement("click-field")
builderWrapper.appendChild(builderClickField)

const builderHexGrid = document.createElement("hex-grid")
builderWrapper.appendChild(builderHexGrid)

const builderToolbar = document.createElement("node-toolbar")
builderWrapper.appendChild(builderToolbar)

const nodeBin = document.createElement("node-bin")
builderWrapper.appendChild(nodeBin)

// Node manipulating

let selectedBlockType = Blocks.BLOCK_TYPENAME_DEFAULT

function deleteNodeFromSequence(node) {
    // Parent null method
    node.parentNode.edges[node.edgeOfParent] = null

    // Nodes to be removed will be removed from main DNA
    // sequence object when rendered
    renderFocusedOrganism()
}

function createNode(parentNode, edge) {
    const createdNode = DNA.addNodeToParent(
        parentNode,
        edge,
        selectedBlockType
    )

    renderFocusedOrganism()

    return createdNode
}

// Node block-selection toolbar

function setNodeToolbar() {
    // TODO: proper node type selector

    const nodeBlockSelector = document.createElement("select")
    builderToolbar.appendChild(nodeBlockSelector)

    Blocks.PlayerAccessibleBlockTypeNamesList.forEach((blockTypeName) => {
        const nodeBlockSelectorOption = document.createElement("option")
        nodeBlockSelectorOption.innerText = blockTypeName
        nodeBlockSelector.appendChild(nodeBlockSelectorOption)
    })

    nodeBlockSelector.onchange = () => {
        selectedBlockType = nodeBlockSelector.value
    }
}
setNodeToolbar()

// Node click

let isMouseDrawingNodes = false

const get3DNodeAtScreenPos = (pos) => {
    const hit3D = ThreeElements.hit3DFromCanvasClickPos(pos)
    if (hit3D) {
        return hit3D.object.nodePos.node
    } else {
        return false
    }
}

function nodeClickHandler(e) {
    // Get selected hexagon

    let clickedHex = null

    for (const hexPos of hexGrid.hexPositions) {
        if (
            (
                (e.pageX > hexPos.x - (hexGrid.side / 2)) &&
                (e.pageX < (hexPos.x + (hexGrid.side / 2)))
            ) &&
            (
                (e.pageY > hexPos.y - (hexGrid.side / 2)) &&
                (e.pageY < (hexPos.y + (hexGrid.side / 2)))
            )
        ) {
            clickedHex = hexPos
            break
        }
    }

    if (!clickedHex) {
        return
    }

    // Check if a node exists at this point

    const nodeAtClickPoint = get3DNodeAtScreenPos({
        x: clickedHex.x, y: clickedHex.y
    })
    if (nodeAtClickPoint) {
        console.log("clicked node", nodeAtClickPoint)
        return
    }

    // Find a connecting node

    let connectingNode = null
    let connectingEdge = 0

    for (let hexEdgeIndex = 0; hexEdgeIndex < 6; hexEdgeIndex++) {
        const neighbourHex = hexGrid.hexTable[clickedHex.neighbours[hexEdgeIndex]]
        const actualEdge = hexEdgeIndex + 1

        const hit3DNode = get3DNodeAtScreenPos({
            x: neighbourHex.x, y: neighbourHex.y
        })
        if (hit3DNode) {
            connectingNode = hit3DNode

            connectingEdge = hexConnectingEdgeMap[actualEdge] - 1

            break;
        }
    }

    if (!connectingNode) {
        console.warn("No connecting edge found for new node")
        isMouseDrawingNodes = false
        return
    }

    const createdNode = createNode(connectingNode, connectingEdge)
    console.log("created node", createdNode)
}
builderClickField.addEventListener("click", nodeClickHandler)
builderClickField.addEventListener("touchstart", nodeClickHandler)

// Node dragging

const nodeDragging = {
    currentNode: null,
    fakeTreeMesh: null
}

let binBoundingBox = null
const isInBin = (x, y) => {
    return (
        x > binBoundingBox.left && y > binBoundingBox.top
    )
}

const nodeDraggingMouseMoveHandler = (e) => {
    if (nodeDragging.currentNode) {
        e.preventDefault()

        // Highlight bin on hover
        if (isInBin(e.pageX, e.pageY)) {
            nodeBin.style.transform = "scale(2)"
        } else {
            nodeBin.style.transform = "scale(1)"
        }

        // Get world pos of mouse pos
        const pos3D = ThreeElements.mousePosTo3DPos({ x: e.pageX, y: e.pageY })

        // Render drag visuals
        nodeDragging.fakeTreeMesh.position.set(
            pos3D.x,
            pos3D.y,
            0
        )
    } else {
        if (isMouseDrawingNodes) {
            nodeClickHandler(e)
        }
    }
}
builderClickField.addEventListener("mousemove", nodeDraggingMouseMoveHandler)
builderClickField.addEventListener("touchmove", nodeDraggingMouseMoveHandler)

const nodeDraggingMouseUpHandler = (e) => {
    isMouseDrawingNodes = false

    if (nodeDragging.currentNode) {
        // Check if user has put node in the bin
        if (isInBin(e.pageX, e.pageY)) {
            deleteNodeFromSequence(nodeDragging.currentNode)
        }

        // Reset drag visuals
        nodeBin.style.transform = "scale(1)"
        builderWrapper.appendChild(builderHexGrid)
        ThreeElements.scene.remove(nodeDragging.fakeTreeMesh)

        // Reset organism to original state
        delete nodeDragging.currentNode["builderUIBeingDragged"]
        nodeDragging.currentNode = null
        focusedOrganism.rebuildMesh()
    }
}
builderClickField.addEventListener("mouseup", nodeDraggingMouseUpHandler)
builderClickField.addEventListener("touchend", nodeDraggingMouseUpHandler)
builderClickField.addEventListener("mouseout", nodeDraggingMouseUpHandler)

function startDraggingNode(node) {
    isMouseDrawingNodes = false

    // Setup elements
    binBoundingBox = getGlobalBoundingBoxOfHTMLElement(nodeBin)
    builderHexGrid.remove()

    // Set dragged node
    nodeDragging.currentNode = node

    // Create shallow clone of node to create
    // a fake version to be dragged around
    const clonedNode = new DNA.dnaNode(
        node.role,
        node.block,
        node.edges
    )

    // Re-render main sequence so this node has
    // appears "removed"
    node.builderUIBeingDragged = true
    focusedOrganism.rebuildMesh()

    // Build fake node that appears dragged
    const fakeTreeNodePositions = OrganismBuilder.generateAbsoluteNodePositions(
        clonedNode,
        true
    )
    nodeDragging.fakeTreeMesh = OrganismBuilder.buildBodyFromNodePositions(
        fakeTreeNodePositions
    )
    ThreeElements.scene.add(nodeDragging.fakeTreeMesh)
}

const nodeDraggingMouseDownHandler = (e) => {
    e.preventDefault()

    if (isMouseDrawingNodes) {
        return
    }

    isMouseDrawingNodes = true

    const clickedNode = get3DNodeAtScreenPos(
        {
            x: e.pageX,
            y: e.pageY
        }
    )

    if (!clickedNode) {
        return
    }

    let mouseDownOnNode = true
    const mouseUpListener = () => {
        mouseDownOnNode = false

        builderWrapper.removeEventListener("mouseup", mouseUpListener)
        builderWrapper.removeEventListener("touchend", mouseUpListener)
    }

    // Sub-tree dragging ability
    if (clickedNode.role !== "root") {

        setTimeout(() => {
            if (mouseDownOnNode) {
                startDraggingNode(clickedNode)
            }
        }, 250)

        builderClickField.addEventListener("mouseup", mouseUpListener)
        builderClickField.addEventListener("touchend", mouseUpListener)
    }
}
builderClickField.addEventListener("mousedown", nodeDraggingMouseDownHandler)
builderClickField.addEventListener("touchstart", nodeDraggingMouseDownHandler)

// Organism rendering

function renderFocusedOrganism() {
    if (focusedOrganism) {
        focusedOrganism.updateTraitsFromDNA(currentDNASequence);
    } else {
        focusedOrganism = Organisms.addOrganism(currentDNASequence)
    }
}

// Init

function init(playerOrganism) {
    // Init focused organism and DNA sequence
    focusedOrganism = playerOrganism
    currentDNASequence = focusedOrganism.dnaSequence

    // Initial render of organism
    renderFocusedOrganism()

    // Create hex grid
    generateHexagonGrid()
    builderHexGrid.style.backgroundImage = `url(${hexGrid.image})`
}

// Visibility

function toggleVisibility() {
    if (builderWrapper.isHidden) {
        builderWrapper.isHidden = false
        document.getElementById('game-wrapper').appendChild(builderWrapper)
    } else {
        builderWrapper.isHidden = true
        builderWrapper.remove()
    }
}

export { init, toggleVisibility }