/*

    Pool

*/

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
    }
}

export default Pool