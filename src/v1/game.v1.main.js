/*

    Main

*/

import * as ThreeElements from "./game.v1.3d"

import DNA from "./game.v1.dna"
import Organism from "./game.v1.organism"
import Pool from "./game.v1.pool"

function init() {

    const currentPool = new Pool("123")

    currentPool.addOrganism(
        new Organism(
            new DNA()
        )
    )

}

export { init }