/*

    Pool

*/

import * as ThreeElements from "./game.v1.3d"
import Organism from "./game.v1.organism"

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
        // Update all organism motion
        // And sync organisms for interactions
        for (const organism of this.organisms) {
            organism.updateMovement()
        }
    }
}

export default Pool