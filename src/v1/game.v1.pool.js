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
import { UPDATES_PER_SEC } from "./game.v1.references"

// Pool model

class Pool {
    constructor(
        id,
        presetOrganisms = [],
        timeSync,
        isMultiplayerMode = false
    ) {
        if (id) {
            this.id = id
        } else {
            this.id = generateID()
        }

        // Determines what features should be shown
        this.isMultiplayerMode = isMultiplayerMode

        // To be implemented
        this.author = {
            id: null,
            username: null
        }

        // Time sync data
        if (timeSync) {
            this.timeSync = timeSync
        } else {
            this.timeSync = {
                pool: Date.now(),
                organisms: {}
            }
        }

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

        // Save creation time for syncing
        if (organism.id in this.timeSync.organisms == false) {
            this.timeSync.organisms[organism.id] = Date.now()
        }

        // Add gamertag if in multiplayer
        // Only add gamer tag to player-created organisms
        // i.e ones with authors
        if (this.isMultiplayerMode && this.author.username) {
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
            new DNA(
                presetOrganismJson.dna.role,
                presetOrganismJson.dna.block.typeName,
                presetOrganismJson.dna.children,
                presetOrganismJson.dna.detach
            ),
            presetOrganismJson.id,
            this
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
    updateLife(timeOfUpdate = Date.now()) {
        // Only get organisms that have been created by the time
        // of this update
        const existingOrganisms = this.organisms.filter((organism) => {
            const orgCreationTime = this.timeSync.organisms[organism.id]
            return (orgCreationTime < timeOfUpdate)
        })

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
    syncLifeToTime(timeToUpdateTo = Date.now()) {
        if (timeToUpdateTo < this.timeSync.pool) {
            throw new Error("Impossible time specified")
        }

        let timeDeltaSecs = Math.round(
            (timeToUpdateTo - this.timeSync.pool) / 1000
        )
        console.log("Updates to catch-up on:", timeDeltaSecs * UPDATES_PER_SEC)
        while (timeDeltaSecs > 0) {
            const timeOfThisUpdate = timeToUpdateTo - timeDeltaSecs
            // Update UPS for each second since starting
            for (let uI = 0; uI < UPDATES_PER_SEC; uI++) {
                this.updateLife(timeOfThisUpdate)
            }
            timeDeltaSecs--
        }
    }
    getStaticExport() {
        const staticExport = {
            id: this.id,
            timeSync: this.timeSync,
            // Organisms must be converted into
            // static data
            organisms: []
        }
        this.organisms.forEach((organism) => {
            staticExport.organisms.push(
                {
                    id: organism.id,
                    absorbedFood: organism.absorbedFood,
                    state: {
                        energy: organism.energy,
                        nodeStateSync: organism.nodeStateSync,
                        ui: {
                            syncBacklog: organism.ui.syncBacklog
                        }
                    },
                    body: {
                        position: organism.body.mesh.position,
                        rotation: organism.body.mesh.rotation
                    },
                    dna: organism.dnaModel.getStaticClone()
                }
            )
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
                console.log(`Importing ${servOrg.id}`)
                this.addOrganism(new Organism(
                    new DNA(
                        servOrg.dna.role,
                        servOrg.dna.block.typeName,
                        servOrg.dna.children,
                        servOrg.dna.detach
                    ),
                    servOrg.id,
                    this
                ))
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
            uiMustLogin()
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
                    `/${gameStateData.id}_offline`
                );
            }
        }).catch(e => {
            console.error("Error occurred during saving", e)
            uiGenericError()
        }).finally(() => {
            if (!silently) {
                loadingUi.close()
            }
        });
    }
}

export default Pool