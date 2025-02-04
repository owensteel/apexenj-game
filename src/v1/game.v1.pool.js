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
    constructor(id = generateID(), presetOrganisms = []) {
        this.id = id
        this.organisms = []

        // Pre-add any preset organisms
        presetOrganisms.forEach((presetOrganismDNAJson) => {
            const presetOrganismDNA = new DNA(
                presetOrganismDNAJson.role,
                presetOrganismDNAJson.block.typeName,
                presetOrganismDNAJson.children,
                presetOrganismDNAJson.detach
            )
            const organism = new Organism(presetOrganismDNA)
            this.addOrganism(organism)
        })
    }
    addOrganism(organism) {
        if (organism instanceof Organism == false) {
            throw new Error("Organism must be instance of Organism class")
        }
        this.organisms.push(organism)
        ThreeElements.scene.add(organism.body.mesh)
    }
    updateLife() {
        // Update all organism motion and living states
        for (const organism of this.organisms) {
            // Update organism energy/state
            organism.updateLivingState()
            // Update organism motion
            organism.updateMovement()
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
            // Get static clone of every organism
            organisms: this.organisms.map((organism) => {
                return organism.dnaModel.getStaticClone()
            })
        })
    }
}

export default Pool