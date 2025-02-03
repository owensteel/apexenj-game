/*

    Organism

*/

import DNA from "./game.v1.dna"

class Organism {
    constructor(dnaModel) {
        if (dnaModel instanceof DNA == false) {
            throw new Error("Organism must be initialised with a DNA model")
        }

        this.id = String(Math.random())
        this.dnaModel = dnaModel
    }
}

export default Organism