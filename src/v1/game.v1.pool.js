/*

    Pool

*/

import { toPng } from 'html-to-image';
import msgpack from "msgpack-lite"
import Cookies from 'js-cookie';
import axiosInstance from '../services/api';
import { uiGameSaved, uiGenericError, uiLoading, uiMustLogin } from "./game.v1.ui.dialogs"

import * as ThreeElements from "./game.v1.3d"
import DNA from "./game.v1.dna"
import Organism from "./game.v1.organism"
import syncOrganisms from "./game.v1.organism.sync"
import { generateID } from "./game.v1.utils"

// Pool model

class Pool {
    constructor(
        id,
        presetOrganisms = [],
        isMultiplayerMode = false
    ) {
        if (id) {
            this.id = id
        } else {
            this.id = generateID()
        }

        // Determines what features should be shown
        this.isMultiplayerMode = isMultiplayerMode

        // Pool state
        this.organisms = []

        // Pre-add any preset organisms
        presetOrganisms.forEach((presetOrg) => {
            this.importOrganism(presetOrg)
        })
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
                    syncOrganisms(organism, opponent)
                }
            }
        }
    }
    getStaticExport() {
        const staticExport = {
            id: this.id,
            // Organisms must be converted into
            // static data
            organisms: []
        }
        staticExport.organisms = this.organisms.map((organism) => {
            return organism.getStaticExport()
        })
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
                if (!silently) {
                    uiGameSaved()
                }
                // Update URL so that user re-enters this saved game
                // on refresh instead of going back to empty Sandbox
                window.history.pushState(
                    {
                        "html": document.body.innerHTML,
                        "pageTitle": document.title
                    },
                    "",
                    `/${gameStateData.id}`
                );
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
        const gameStageWrapper = document.getElementsByTagName("game-stage-wrapper")[0]
        const canvasCaptureFullSizeURL = await toPng(gameStageWrapper)
        // Reduce image size to thumbnail dimensions
        const reducedCanvas = document.createElement("canvas")
        reducedCanvas.width = ThreeElements.ThreeCanvas.width / 4
        reducedCanvas.height = ThreeElements.ThreeCanvas.height / 4
        // By "squashing" full size image into a smaller canvas
        const fullSizeCanvCapImg = new Image(
            reducedCanvas.width,
            reducedCanvas.height
        )
        fullSizeCanvCapImg.src = canvasCaptureFullSizeURL
        fullSizeCanvCapImg.onload = () => {
            reducedCanvas.getContext("2d").drawImage(
                fullSizeCanvCapImg,
                0, 0, reducedCanvas.width, reducedCanvas.height
            )
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
}

export default Pool