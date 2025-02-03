/*

    Organism

*/

import DNA from "./game.v1.dna"
import OrganismBody from "./game.v1.organism.body"

class Organism {
    constructor(dnaModel) {
        if (dnaModel instanceof DNA == false) {
            throw new Error("Organism must be initialised with a DNA model")
        }
        this.dnaModel = dnaModel

        this.id = String(Math.random())

        // To be generated
        this.body = new OrganismBody(this.dnaModel)
    }
    updateDna(dnaModel) {
        if (dnaModel instanceof DNA == false) {
            throw new Error("Organism must be initialised with a DNA model")
        }
        this.dnaModel = dnaModel

        // Rebuild body/mesh with new DNA
        this.body.updateDna(this.dnaModel)
    }
}

export default Organism