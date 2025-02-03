/*

    Main

*/

import DNA from "./game.v1.dna"
import Organism from "./game.v1.organism"
import Pool from "./game.v1.pool"

function init() {

    const currentPool = new Pool("123")

    const organismDna = new DNA()
    organismDna.children[0] = new DNA()

    const organism = new Organism(organismDna)
    currentPool.addOrganism(organism)

    console.log(currentPool)
}

export { init }