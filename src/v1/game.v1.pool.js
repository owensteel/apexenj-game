/*

    Pool

*/

import msgpack from "msgpack-lite"
import Cookies from 'js-cookie';
import axiosInstance from '../services/api';
import { uiGameSaved, uiGenericError, uiLoading, uiMustLogin } from "./game.v1.ui.dialogs"

import * as ThreeElements from "./game.v1.3d"
import DNA from "./game.v1.dna"
import Organism from "./game.v1.organism"
import syncOrganisms from "./game.v1.organism.sync"
import { generateID } from "./game.v1.utils"
import { COMMON_PRIMARY_COLOR, COMMON_SECONDARY_COLOR, GAME_MODE_PLAY, GAME_MODE_SANDBOX } from "./game.v1.references";

// Pool model

class Pool {
    constructor(
        id,
        presetOrganisms = [],
        isMultiplayerMode = false,
        gameMode = GAME_MODE_PLAY
    ) {
        if (id) {
            this.id = id
        } else {
            this.id = generateID()
        }

        // Set game mode
        this.gameMode = gameMode
        if (gameMode !== GAME_MODE_PLAY && gameMode !== GAME_MODE_SANDBOX) {
            throw new Error(`Invalid Game Mode specified (${gameMode})`)
        }

        // So we know whether or not to enable autosave
        this.hasBeenCreatedOnServer = false

        // Determines what features should be shown
        this.isMultiplayerMode = isMultiplayerMode

        // Pool state
        this.organisms = []

        // Pre-add any preset organisms
        presetOrganisms.forEach((presetOrg) => {
            this.importOrganism(presetOrg)
        })

        // Sandbox UI
        if (this.gameMode == GAME_MODE_SANDBOX) {
            this.enableSandboxCursorMovement()
        }
    }
    addOrganism(organism) {
        if (organism instanceof Organism == false) {
            throw new Error("Organism must be instance of Organism class")
        }
        this.organisms.push(organism)
        ThreeElements.scene.add(organism.body.mesh)

        // Add gamertag if in multiplayer
        if (this.isMultiplayerMode) {
            organism.ui.applyGamerTag()
        }

        return organism
    }
    importOrganism(presetOrganismJson) {
        console.log("Importing...", presetOrganismJson)

        if (!("dna" in presetOrganismJson)) {
            throw new Error("Cannot import Organism without DNA")
        }

        // Create replica from DNA
        const organism = new Organism(
            new DNA().fromStaticObject(presetOrganismJson.dna),
            presetOrganismJson.id,
            this,
            presetOrganismJson.creatorId
        )
        this.addOrganism(organism)

        // Copy energy
        if ("energy" in presetOrganismJson) {
            organism.energy = presetOrganismJson.energy
        } else if ("state" in presetOrganismJson) {
            organism.energy = presetOrganismJson.state.energy
        } else {
            console.warn("Energy property of imported Organism could not be parsed")
        }

        // Copy position and rotation
        if ("body" in presetOrganismJson) {
            organism.body.mesh.position.copy(presetOrganismJson.body.position)
            organism.body.mesh.rotation.copy(presetOrganismJson.body.rotation)
        }
    }
    removeOrganism(organism) {
        if (organism instanceof Organism == false) {
            throw new Error("Organism must be instance of Organism class")
        }
        const oIndex = this.organisms.findIndex((oS) => {
            return oS.id == organism.id
        })
        this.organisms.splice(oIndex, 1)
        // Prevent "ghost"
        organism.ui.organismUiContainer.remove()
        organism.body.nodePositions = []
        ThreeElements.scene.remove(organism.body.mesh)
        // Fallback in case remove from scene fails
        // (since node positions are by now assuredly
        // empty, all that will remain is the "ghost",
        // so making that invisible is a genuine fallback)
        organism.body.mesh.visible = false
    }
    updateLife() {
        // Only get organisms that have been created by the time
        // of this update
        const existingOrganisms = this.organisms

        // Update all organism motion and living states
        for (const organism of existingOrganisms) {
            // Update organism energy/state
            organism.updateLivingState()
            // Update organism motion
            organism.updateEffects()
            // Remove dead organism
            if (!organism.alive) {
                this.removeOrganism(organism)
            }
        }
        // Sync organisms with each other for interactions
        // (must be separate loop, ALL organisms must be
        // updated before any syncing can occur)
        for (const organism of existingOrganisms) {
            for (const opponent of existingOrganisms) {
                if (opponent.id !== organism.id) {
                    syncOrganisms(organism, opponent, this.gameMode)
                }
            }
        }
    }
    getStaticExport() {
        const staticExport = {
            id: this.id,
            // Organisms must be converted into
            // static data
            organisms: this.organisms.map((organism) => {
                return organism.getStaticExport()
            })
        }
        return staticExport
    }
    exportToJson() {
        return JSON.stringify(this.staticExportCache)
    }
    // Multiplayer
    syncWithServerState(serverGameState) {
        // Import any new organisms from server
        serverGameState.organisms.forEach((servOrg) => {
            const realOrg = this.organisms.find((oS) => {
                return oS.id == servOrg.id
            })
            if (!realOrg && "dna" in servOrg) {
                this.importOrganism(servOrg)
            }
        })
        // Update all organisms
        this.organisms.forEach((cliOrg) => {
            const servOrg = serverGameState.organisms.find((oS) => {
                return oS.id == cliOrg.id
            })
            if (servOrg) {
                // Update to server state
                cliOrg.energy = servOrg.state.energy
                if (servOrg.state.nodeStateSync) {
                    cliOrg.nodeStateSync.states = servOrg.state.nodeStateSync.states
                }
                // Update to server position
                cliOrg.body.mesh.position.copy(servOrg.body.position)
                cliOrg.body.mesh.rotation.copy(servOrg.body.rotation)
                cliOrg.body.updateNodePosWorldPositions()
                // Update living effects
                cliOrg.updateEffects(true)
                // Sync UI
                if (servOrg.state.ui) {
                    cliOrg.ui.processSyncBacklog(servOrg.state.ui.syncBacklog)
                }
            } else {
                // No longer exists on server, so remove here
                this.removeOrganism(cliOrg)
            }
        })
    }
    saveStateToServer(silently = false) {
        const authToken = Cookies.get('auth_token');
        if (!authToken) {
            uiMustLogin(() => {
                // Attempt to save again once logged-in
                this.saveStateToServer()
            })
            return
        }
        let loadingUi
        if (!silently) {
            loadingUi = uiLoading()
        }
        const gameStateData = this.getStaticExport()
        axiosInstance.post('/games/save', {
            stateDataBuffer: msgpack.encode(gameStateData)
        }, {
            headers: {
                Authorization: `Bearer ${authToken}`
            }
        }).then((response) => {
            if (response.status === 201) {
                // Update URL so that user re-enters this saved game
                // on refresh instead of going back to empty Sandbox
                window.history.pushState(
                    {
                        "pageTitle": document.title
                    },
                    "",
                    `/${gameStateData.id}`
                );

                // Game first initialisated
                if (!this.hasBeenCreatedOnServer) {
                    // Reinstate Loading UI until init has completed
                    loadingUi.close()
                    loadingUi = uiLoading()
                    this.saveThumbnailToServer().finally(() => {
                        // UI placebo
                        loadingUi.close()
                        uiGameSaved()
                        // Update URL on frontend
                        setTimeout(() => {
                            // For some reason a timeout is needed for
                            // the thumbnail to appear on the frontend
                            window.parent.postMessage(
                                {
                                    messageType: "gameCreated",
                                    gameId: this.id
                                }, "*"
                            );
                        }, 1000)
                        // Start autosave and other autosave features
                        this.hasBeenCreatedOnServer = true
                    })
                } else {
                    if (!silently) {
                        uiGameSaved()
                    }
                }
            }
        }).catch(e => {
            console.error("Error occurred during saving", e)
            if (!silently) {
                uiGenericError()
            }
        }).finally(() => {
            if (!silently) {
                loadingUi.close()
            }
        });
    }
    async saveThumbnailToServer() {
        // Full-size capture of canvas
        const canvasCaptureFullSizeURL = ThreeElements.ThreeCanvas.toDataURL()
        // Reduce image size to thumbnail dimensions
        const reducedCanvas = document.createElement("canvas")
        reducedCanvas.width = ThreeElements.ThreeCanvas.width / 4
        reducedCanvas.height = ThreeElements.ThreeCanvas.height / 4
        const reducedCanvasCtx = reducedCanvas.getContext("2d")
        // Mirror UI background, without the pattern
        reducedCanvasCtx.fillStyle = COMMON_SECONDARY_COLOR
        reducedCanvasCtx.fillRect(
            0,
            0,
            reducedCanvas.width,
            reducedCanvas.height
        )
        // "Squash" full size image into the smaller/"reducing" canvas
        const fullSizeCanvCapImg = new Image(
            reducedCanvas.width,
            reducedCanvas.height
        )
        fullSizeCanvCapImg.src = canvasCaptureFullSizeURL
        fullSizeCanvCapImg.onload = () => {
            reducedCanvasCtx.drawImage(
                fullSizeCanvCapImg,
                0, 0, reducedCanvas.width, reducedCanvas.height
            )
            // Export as jpeg as a solid background has now been added
            const reducedCanvasDataURL = reducedCanvas.toDataURL(
                "image/jpeg", 1
            )
            // Save new canvas
            axiosInstance.post("/thumbnails/save", {
                subjectType: "game",
                subjectPublicId: this.id,
                thumbImageUrl: reducedCanvasDataURL
            })
        }
    }
    // Sandbox UI
    // Sandbox Mode cursor movement
    enableSandboxCursorMovement() {
        const gameStageWrapper = document.getElementsByTagName("game-stage-wrapper")[0]
        const cW = gameStageWrapper.clientWidth;
        const cH = gameStageWrapper.clientHeight;

        const getClickPosFromScreenPos = (screenPos) => {
            const rect = gameStageWrapper.getBoundingClientRect();
            return {
                x: screenPos.x - rect.left,
                y: screenPos.y - rect.top
            };
        }

        let focusedOrganismRootNodePos = null

        const stageClickEvent = (e) => {
            const hit3D = ThreeElements.hit3DFromCanvasClickPos({
                x: e.pageX, y: e.pageY
            })
            if (hit3D && hit3D.object && hit3D.object.nodePos) {
                focusedOrganismRootNodePos = hit3D.object.nodePos;
                while (focusedOrganismRootNodePos.parentNodePos !== null) {
                    focusedOrganismRootNodePos = focusedOrganismRootNodePos.parentNodePos
                }
            }
        }
        const stageDragEvent = (e) => {
            if (focusedOrganismRootNodePos) {
                const clickPos = getClickPosFromScreenPos({
                    x: e.pageX, y: e.pageY
                })

                focusedOrganismRootNodePos.mesh.position.x = clickPos.x - (cW / 2);
                focusedOrganismRootNodePos.mesh.position.y = -(clickPos.y - (cH / 2));
            }
        }
        const stageUnfocusEvent = (e) => {
            focusedOrganismRootNodePos = null
        }

        gameStageWrapper.addEventListener("mousedown", stageClickEvent)
        gameStageWrapper.addEventListener("touchstart", stageClickEvent)
        gameStageWrapper.addEventListener("mousemove", stageDragEvent)
        gameStageWrapper.addEventListener("touchmove", stageDragEvent)
        gameStageWrapper.addEventListener("mouseup", stageUnfocusEvent)
        gameStageWrapper.addEventListener("mouseout", stageUnfocusEvent)
        gameStageWrapper.addEventListener("touchend", stageUnfocusEvent)
    }
}

export default Pool