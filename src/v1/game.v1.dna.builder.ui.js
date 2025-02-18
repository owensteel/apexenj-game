/* 
    DNA Builder UI

    Provides visual editor for a given DNA sequence.
*/

import DNA from "./game.v1.dna";
import * as Blocks from "./game.v1.blocks";
import { getGlobalBoundingBoxOfHTMLElement } from "./game.v1.utils";
import { COMMON_PRIMARY_COLOR, DNA_NODE_ROLE_ROOT, NODESIZE_DEFAULT } from "./game.v1.references";
import { generateAbsoluteNodePositions } from "./game.v1.3d";
import Pool from "./game.v1.pool";
import Organism from "./game.v1.organism";
import MultiplayerClient from "./game.v1.multiplayerClient"
import { uiMustLogin } from "./game.v1.ui.dialogs";

// Size of nodes in designer render

const NODE_SIZE_BUILDER = NODESIZE_DEFAULT * 2

// Static tables for hexagon operations

const neighbourOffsetsEven = [
    { dc: 0, dr: -1 },
    { dc: -1, dr: -1 },
    { dc: -1, dr: 0 },
    { dc: 0, dr: 1 },
    { dc: +1, dr: 0 },
    { dc: +1, dr: -1 }
];
const neighbourOffsetsOdd = [
    { dc: 0, dr: -1 },
    { dc: -1, dr: 0 },
    { dc: -1, dr: +1 },
    { dc: 0, dr: +1 },
    { dc: +1, dr: +1 },
    { dc: +1, dr: 0 }
];
const hexConnectingEdgeMap = { 1: 4, 2: 5, 3: 6, 4: 1, 5: 2, 6: 3 };

// Static functions

// Computes the neighbours of a hex given its col/row and grid dimensions.
function getHexNeighbours(col, row, columns, rows) {
    const offsets = (col % 2 === 1) ? neighbourOffsetsOdd : neighbourOffsetsEven;
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

// Draws a single flat-topped hexagon at (cx, cy) on the provided canvas context.
function drawHexagon(cx, cy, ctx, side, fillColor = "transparent", strokeWidth = 1) {
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = "black";
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();

    // For flat-topped hex: angles 0°, 60°, 120°, … 300°
    for (let i = 0; i < 6; i++) {
        const angleDeg = 60 * i;
        const angleRad = (Math.PI / 180) * angleDeg;
        const x = cx + side * Math.cos(angleRad);
        const y = cy + side * Math.sin(angleRad);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    return { x: cx, y: cy };
}

// Builder UI class

class DNABuilderUI {
    constructor(
        dnaModel,
        currentPool,
        multiplayerClient
    ) {
        this.multiplayerClient = multiplayerClient
        if (multiplayerClient && !(multiplayerClient instanceof MultiplayerClient)) {
            throw new Error("If in multiplayer mode, a valid Multiplayer Client must be provided")
        }

        if (!(dnaModel instanceof DNA)) {
            throw new Error("Builder UI must have DNA model");
        }
        this.focusedDnaModel = dnaModel;

        if (!(currentPool instanceof Pool)) {
            throw new Error("Builder UI must have reference to current Pool");
        }
        this.currentPool = currentPool;

        // Hex grid configuration
        this.hexGrid = {
            side: NODE_SIZE_BUILDER,
            hexPositions: [],
            hexTable: {},
            image: null
        };

        // Instance state
        this.renderedVisualNodePositions = null;
        this.selectedBlockType = Blocks.BLOCK_TYPENAME_DEFAULT;
        this.isMouseDown = false;

        // Init root DOM element
        this.builderWrapper = document.createElement("game-builder-wrapper");
        this.UIisHidden = false;

        // Node operation states
        this.selectedNode = null
    }

    initDOM() {
        // Create DOM elements for the Builder UI

        this.builderClickField = document.createElement("click-field");
        this.builderWrapper.appendChild(this.builderClickField);

        this.builderHexGrid = document.createElement("hex-grid");
        this.builderWrapper.appendChild(this.builderHexGrid);

        this.builderCanvas = document.createElement("canvas");
        this.builderCanvas.className = "builder-canvas";
        this.builderWrapper.appendChild(this.builderCanvas);

        this.builderToolbar = document.createElement("node-toolbar");
        this.builderWrapper.appendChild(this.builderToolbar);

        // Setup Builder Toolbar
        this._setBuilderControls();

        // Bind event listeners (using arrow functions to preserve context)
        this.builderClickField.addEventListener("click", (e) => this._nodeClickHandler(e));
        this.builderClickField.addEventListener("touchstart", (e) => this._nodeClickHandler(e));

        this.builderClickField.addEventListener("mousemove", (e) => this._nodeCanvasMouseMoveHandler(e));
        this.builderClickField.addEventListener("touchmove", (e) => this._nodeCanvasMouseMoveHandler(e));

        this.builderClickField.addEventListener("mouseup", (e) => this._nodeCanvasMouseUpHandler(e));
        this.builderClickField.addEventListener("touchend", (e) => this._nodeCanvasMouseUpHandler(e));
        this.builderClickField.addEventListener("mouseout", (e) => this._nodeCanvasMouseUpHandler(e));

        this.builderClickField.addEventListener("mousedown", (e) => this._nodeCanvasMouseDownHandler(e));
        this.builderClickField.addEventListener("touchstart", (e) => this._nodeCanvasMouseDownHandler(e));

        // Initialize canvas
        this.builderCanvas.width = this.builderWrapper.clientWidth;
        this.builderCanvas.height = this.builderWrapper.clientHeight;
        this._generateHexagonGrid();
        this.builderHexGrid.style.backgroundImage = `url(${this.hexGrid.image})`;
        this._renderBuilderUIVisual();
    }

    showUI() {
        if (this.UIisHidden) {
            this.builderWrapper.style.bottom = "";
            this.UIisHidden = false

            document.querySelector(".builder-ui-show-button").classList.add("hidden")
        }
    }

    hideUI() {
        if (!this.UIisHidden) {
            this.builderWrapper.style.bottom = -this.builderWrapper.clientHeight;
            this.UIisHidden = true

            document.querySelector(".builder-ui-show-button").classList.remove("hidden")
        }
    }

    // Internal Utility Methods

    // Generates the hexagon grid used for visualising the Builder UI.
    _generateHexagonGrid() {
        // Clear previous grid
        this.hexGrid.hexPositions = [];
        this.hexGrid.hexTable = {};

        const canvas = document.createElement("canvas");
        canvas.width = this.builderWrapper.clientWidth;
        canvas.height = this.builderWrapper.clientHeight;
        const ctx = canvas.getContext("2d");

        const side = this.hexGrid.side;

        // For flat-topped hexes:
        // - Width of each hex is 2 * side
        // - Vertical gap: sqrt(3) * side
        // - Horizontal gap: 1.5 * side
        const columns = Math.ceil(this.builderWrapper.clientWidth / side) + 5;
        const rows = Math.ceil(this.builderWrapper.clientHeight / side) + 5;
        const horizontalSpacing = 1.5 * side;
        const verticalSpacing = Math.sqrt(3) * side;

        // Helper to compute local x,y (unshifted) for a given col/row.
        const getLocalCoords = (col, row) => {
            const verticalOffset = (col % 2) ? verticalSpacing / 2 : 0;
            const localX = col * horizontalSpacing + side;
            const localY = row * verticalSpacing + verticalOffset + side;
            return [localX, localY];
        };

        const centreCol = Math.floor(columns / 2);
        const centreRow = Math.floor(rows / 2);
        const [centreLocalX, centreLocalY] = getLocalCoords(centreCol, centreRow);
        const halfWidth = canvas.width / 2;
        const halfHeight = canvas.height / 2;

        for (let col = 0; col < columns; col++) {
            for (let row = 0; row < rows; row++) {
                const [localX, localY] = getLocalCoords(col, row);
                const finalX = localX - centreLocalX + halfWidth;
                const finalY = localY - centreLocalY + halfHeight;
                const hexPos = drawHexagon(finalX, finalY, ctx, this.hexGrid.side);
                hexPos.col = col;
                hexPos.row = row;
                this.hexGrid.hexPositions.push(hexPos);

                const hexKey = `${col},${row}`;
                this.hexGrid.hexTable[hexKey] = hexPos;
            }
        }

        // Cache neighbours for each hexagon.
        for (let col = 0; col < columns; col++) {
            for (let row = 0; row < rows; row++) {
                const hexKey = `${col},${row}`;
                const hex = this.hexGrid.hexTable[hexKey];
                if (hex) {
                    const neighbours = getHexNeighbours(col, row, columns, rows);
                    hex.neighbours = neighbours.map(({ col: nCol, row: nRow }) => `${nCol},${nRow}`);
                }
            }
        }

        // Export the grid as an image (data URL)
        this.hexGrid.image = canvas.toDataURL();
    }

    // Configures the toolbar UI.
    _setBuilderControls() {
        // Bin

        const nodeBin = document.createElement("button");
        nodeBin.className = "node-bin"
        nodeBin.onclick = () => {
            if (this.selectedNode) {
                const nodeToDelete = this.selectedNode
                if (nodeToDelete.parentNode) {
                    nodeToDelete.parentNode.deleteChild(nodeToDelete);
                }

                this.selectedNode = null
                this._renderBuilderUIVisual();
                this.nodeBin.hide()
            }
        }
        nodeBin.show = () => {
            this.builderWrapper.appendChild(nodeBin);
        }
        nodeBin.hide = () => {
            nodeBin.remove()
        }
        this.nodeBin = nodeBin;

        // Node selection palette

        let nodeBlockPaletteCollapsed = false

        const nodeBlockPalette = document.createElement("node-block-palette");
        this.builderWrapper.appendChild(nodeBlockPalette);

        const blockTypeBlobs = []
        const renderBlockTypeBlobs = () => {
            for (const blockTypeBlob of blockTypeBlobs) {
                if (blockTypeBlob.blockTypeName == this.selectedBlockType) {
                    blockTypeBlob.classList.add("selected")
                } else {
                    blockTypeBlob.classList.remove("selected")
                }
            }
        }
        Blocks.PlayerAccessibleBlockTypeNamesList.forEach((blockTypeName, blockTypeInd) => {
            const blockTypeBlob = document.createElement("node-block-palette-blob");
            const blockTypeColor = Blocks.getBlockInstanceFromTypeName(blockTypeName).color

            // Element styles
            blockTypeBlob.innerHTML = `<hexagon style='background-color:${blockTypeColor}'></hexagon>`
            // Make positions absolute for collapsing animation
            blockTypeBlob.style.top = 25 + (60 * blockTypeInd) + "px"

            nodeBlockPalette.appendChild(blockTypeBlob);

            blockTypeBlob.blockTypeName = blockTypeName
            blockTypeBlob.onclick = () => {
                if (blockTypeName == this.selectedBlockType) {
                    // Toggle show/hide
                    if (!nodeBlockPaletteCollapsed) {
                        nodeBlockPalette.setAttribute("collapsed", true)
                    } else {
                        nodeBlockPalette.removeAttribute("collapsed")
                    }
                    nodeBlockPaletteCollapsed = !nodeBlockPaletteCollapsed
                } else {
                    this.selectedBlockType = blockTypeName
                    renderBlockTypeBlobs()
                }
            }

            blockTypeBlobs.push(blockTypeBlob)
        });
        renderBlockTypeBlobs()

        // Show/hide buttons

        const hideButton = document.createElement("button")
        hideButton.className = "builder-ui-hide-button"
        hideButton.onclick = () => {
            this.hideUI()
        }
        this.builderWrapper.appendChild(hideButton)

        const showButton = document.createElement("button")
        showButton.className = "builder-ui-show-button"
        // Hide by default, as UI is shown by default
        showButton.classList.add("hidden")
        showButton.onclick = () => {
            this.showUI()
        }
        document.getElementById("game-wrapper").appendChild(showButton)

        // Deploy organism

        const deployOrganismButton = document.createElement("button")
        deployOrganismButton.className = "builder-ui-deploy-organism-button"
        deployOrganismButton.onclick = () => {
            this.hideUI()

            const newOrganism = new Organism(
                this.focusedDnaModel,
                null,
                this.currentPool
            )

            // Send to server if needed
            if (this.multiplayerClient && this.multiplayerClient.role == "client") {
                // Not host, needs to be sent to sync service
                if (this.multiplayerClient.playerAccount.isLoggedIn) {
                    // Player must be logged-in to create Organisms in public Pool
                    this.multiplayerClient.connectionSocket.emit(
                        "pool_new_organism",
                        {
                            poolId: this.currentPool.id,
                            organismData: {
                                id: newOrganism.id,
                                dna: newOrganism.dnaModel.getStaticClone()
                            }
                        }
                    );
                } else {
                    uiMustLogin()
                }
            } else {
                // Offline or host, can be added instantly
                this.currentPool.addOrganism(newOrganism)
            }
        }
        this.builderWrapper.appendChild(deployOrganismButton)
    }

    // Mouse & Touch Event Handlers

    _getClickPosFromScreenPos(screenPos) {
        const rect = this.builderClickField.getBoundingClientRect();
        return {
            x: screenPos.x - rect.left,
            y: screenPos.y - rect.top
        };
    }

    _getHexAtClickPos(clickPos) {
        let clickedHex = null;
        for (const hexPos of this.hexGrid.hexPositions) {
            if (
                (clickPos.x > hexPos.x - (this.hexGrid.side / 2)) &&
                (clickPos.x < hexPos.x + (this.hexGrid.side / 2)) &&
                (clickPos.y > hexPos.y - (this.hexGrid.side / 2)) &&
                (clickPos.y < hexPos.y + (this.hexGrid.side / 2))
            ) {
                clickedHex = hexPos;
                break;
            }
        }
        return clickedHex;
    }

    _getVisNodeAtClickPos(clickPos) {
        let clickedNode = null;
        if (this.renderedVisualNodePositions) {
            for (const nodePos of this.renderedVisualNodePositions) {
                if (
                    (clickPos.x > nodePos.uiClickX - (this.hexGrid.side / 2)) &&
                    (clickPos.x < nodePos.uiClickX + (this.hexGrid.side / 2)) &&
                    (clickPos.y > nodePos.uiClickY - (this.hexGrid.side / 2)) &&
                    (clickPos.y < nodePos.uiClickY + (this.hexGrid.side / 2))
                ) {
                    clickedNode = nodePos.node;
                    break;
                }
            }
        }
        return clickedNode;
    }

    _nodeClickHandler(e, isDragging = false) {
        // Select node

        const clickPos = this._getClickPosFromScreenPos({ x: e.pageX, y: e.pageY });

        // Deselect any selected node
        if (this.selectedNode) {
            this.selectedNode.builderUiSelectedNode = false
            this.selectedNode = null
            this._renderBuilderUIVisual()
            this.nodeBin.hide()
        }

        const clickedNode = this._getVisNodeAtClickPos(clickPos);
        if (clickedNode) {
            if (!isDragging) {
                // Node click interactions

                // Select node
                if (!clickedNode.builderUiSelectedNode && clickedNode.role !== DNA_NODE_ROLE_ROOT) {
                    this.selectedNode = clickedNode
                    clickedNode.builderUiSelectedNode = true

                    this._renderBuilderUIVisual()
                    this.nodeBin.show()
                }
            }
            // Prevent any creation event at this point
            // Otherwise it will cause a "replacement"
            // and potentially destroy children
            return;
        }

        // Create node

        const clickedHex = this._getHexAtClickPos(clickPos);
        if (!clickedHex) return;

        // Determine connecting node based on neighbouring hexes

        let connectingNode = null;
        let connectingEdge = 0;

        for (let hexEdgeIndex = 0; hexEdgeIndex < 6; hexEdgeIndex++) {
            const neighbourKey = clickedHex.neighbours[hexEdgeIndex];
            const neighbourHex = this.hexGrid.hexTable[neighbourKey];
            if (!neighbourHex) continue;

            const hitVisNode = this._getVisNodeAtClickPos({ x: neighbourHex.x, y: neighbourHex.y });
            if (hitVisNode) {
                connectingNode = hitVisNode;
                connectingEdge = hexConnectingEdgeMap[hexEdgeIndex + 1] - 1;
                break;
            }
        }

        if (!connectingNode) {
            return;
        }

        // Create node as a child of closest node (connecting node)

        const createNode = (parentNode, edge) => {
            const createdNode = parentNode.addChild(this.selectedBlockType, edge);
            this._renderBuilderUIVisual();
            return createdNode;
        }
        createNode(connectingNode, connectingEdge);
    }

    _nodeCanvasMouseMoveHandler(e) {
        // Draw
        if (this.isMouseDown) {
            this._nodeClickHandler(e, true);
        }
    }

    _nodeCanvasMouseUpHandler(e) {
        this.isMouseDown = false;
    }

    _nodeCanvasMouseDownHandler(e) {
        e.preventDefault();
        this.isMouseDown = true;
    }

    // Render the Builder UI Visual Representation

    _renderBuilderUIVisual() {
        // Obtain node positions based on current DNA model and node size.
        const nodePositions = generateAbsoluteNodePositions(
            NODE_SIZE_BUILDER,
            this.focusedDnaModel,
            true
        );
        this.renderedVisualNodePositions = nodePositions;

        const selectedTreeNodePositions = []
        const addNodeToSelection = (node) => {
            selectedTreeNodePositions.push(node.nodePos)
            for (const childNode of node.children) {
                if (childNode) {
                    addNodeToSelection(childNode)
                }
            }
        }
        if (this.selectedNode) {
            addNodeToSelection(this.selectedNode)
        }

        const ctx = this.builderCanvas.getContext("2d");
        const cW = this.builderCanvas.clientWidth;
        const cH = this.builderCanvas.clientHeight;

        ctx.clearRect(0, 0, cW, cH);

        // Prepares a hexagon path for reuse in drawing.
        const prepareHexagonPath = (cx, cy, side) => {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angleDeg = 60 * i;
                const angleRad = (Math.PI / 180) * angleDeg;
                const x = cx + side * Math.cos(angleRad);
                const y = cy + side * Math.sin(angleRad);
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
        };

        // Draw node outlines
        const drawNodeOutline = (cx, cy, outlineColor = "#000") => {
            prepareHexagonPath(cx, cy, this.hexGrid.side * 1.1);
            ctx.strokeStyle = outlineColor;
            ctx.lineWidth = 3.5;
            ctx.stroke();
        };

        // Draw filled nodes
        const drawNode = (cx, cy, node) => {
            prepareHexagonPath(cx, cy, this.hexGrid.side);
            ctx.fillStyle = node.block.color;
            ctx.fill();
        };

        const drawNodePositions = (nodePositions, outlineColor = "#000") => {
            // Draw tree outline

            for (const nodePos of nodePositions) {
                drawNodeOutline(
                    (cW / 2) + nodePos.x, (cH / 2) - nodePos.y,
                    outlineColor
                );
            }

            // Draw tree fills

            for (const nodePos of nodePositions) {
                nodePos.uiClickX = (cW / 2) + nodePos.x;
                nodePos.uiClickY = (cH / 2) - nodePos.y;
                drawNode(nodePos.uiClickX, nodePos.uiClickY, nodePos.node);
            }
        }
        drawNodePositions(nodePositions)

        // Draw selected node, if any
        if (selectedTreeNodePositions.length > 0) {
            drawNodePositions(selectedTreeNodePositions, COMMON_PRIMARY_COLOR)
        }
    }
}

export default DNABuilderUI;
