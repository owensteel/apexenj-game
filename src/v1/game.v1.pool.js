/*

    Pool

*/

import * as ThreeElements from "./game.v1.3d"
import DNA from "./game.v1.dna"
import Organism from "./game.v1.organism"
import syncOrganisms from "./game.v1.organism.sync"
import { generateID } from "./game.v1.utils"

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
        presetOrganisms.forEach((presetOrganismJson) => {
            const organism = new Organism(
                new DNA(
                    presetOrganismJson.dna.role,
                    presetOrganismJson.dna.block.typeName,
                    presetOrganismJson.dna.children,
                    presetOrganismJson.dna.detach
                ),
                presetOrganismJson.id
            )
            this.addOrganism(organism)
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
    updateLife() {
        // Update all organism motion and living states
        for (const organism of this.organisms) {
            // Update organism energy/state
            organism.updateLivingState()
            // Update organism motion
            organism.updateMovement()
            // Death check
            if (!organism.alive) {
                console.log("Death", organism.id)
                this.removeOrganism(organism)
            }
        }
        // Sync organisms with each other for interactions
        // (must be separate loop, ALL organisms must be
        // updated before any syncing can occur)
        for (const organism of this.organisms) {
            for (const opponent of this.organisms) {
                if (opponent.id !== organism.id) {
                    syncOrganisms(organism, opponent)
                }
            }
        }
    }
    exportToJson() {
        return JSON.stringify({
            id: this.id,
            // Save only basic static data about organism
            organisms: this.organisms.map((organism) => {
                return {
                    id: organism.id,
                    dna: organism.dnaModel.getStaticClone()
                }
            }),
            timeSync: this.timeSync
        })
    }
}

export default Pool