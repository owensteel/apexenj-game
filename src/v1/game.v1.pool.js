/*

    Pool

*/

import * as ThreeElements from "./game.v1.3d"
import Organism from "./game.v1.organism"
import syncOrganisms from "./game.v1.organism.sync"

// Pool model

class Pool {
    constructor(id) {
        if (!id) {
            throw new Error("Pool ID must be specified")
        }
        this.id = id
        this.organisms = []
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
}

export default Pool