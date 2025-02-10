/*

    Pool

*/

import * as ThreeElements from "./game.v1.3d"
import DNA from "./game.v1.dna"
import Organism from "./game.v1.organism"
import syncOrganisms from "./game.v1.organism.sync"
import { generateID } from "./game.v1.utils"
import { UPDATES_PER_SEC } from "./game.v1.references"

// Pool model

class Pool {
    constructor(id = generateID(), presetOrganisms = [], timeSync) {
        this.id = id
        this.organisms = []

        if (timeSync) {
            this.timeSync = timeSync
        } else {
            this.timeSync = {
                pool: Date.now(),
                organisms: {}
            }
        }

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

        return organism
    }
    importOrganism(presetOrganismJson) {
        console.log("Importing...", presetOrganismJson)
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
        ThreeElements.scene.remove(organism.body.mesh)
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
            organism.updateMovement()
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
    exportToObj() {
        return {
            id: this.id,
            // Static data about organism
            organisms: this.organisms.map((organism) => {
                const servOrg = {
                    id: organism.id,
                    dna: organism.dnaModel.getStaticClone(),
                    state: {
                        energy: organism.energy
                    },
                    body: {
                        position: organism.body.mesh.position,
                        rotation: organism.body.mesh.rotation
                    }
                }
                return servOrg
            }),
            timeSync: this.timeSync
        }
    }
    exportToJson() {
        return JSON.stringify(this.exportToObj())
    }
    // Multiplayer
    syncWithServer(poolData) {
        // Import any new organisms from server
        poolData.organisms.forEach((servOrg) => {
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
            const servOrg = poolData.organisms.find((oS) => {
                return oS.id == cliOrg.id
            })
            if (servOrg) {
                // Update to server state
                cliOrg.energy = servOrg.state.energy
                // Update to server position
                cliOrg.body.mesh.position.copy(servOrg.body.position)
                cliOrg.body.mesh.rotation.copy(servOrg.body.rotation)
                // Update animations
                cliOrg.updateMovement(true)
            } else {
                // No longer exists on server, so remove here
                this.removeOrganism(cliOrg)
            }
        })
    }
}

export default Pool