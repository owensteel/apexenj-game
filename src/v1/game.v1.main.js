/*

    Main

*/

import { BLOCK_TYPENAME_HEART, BLOCK_TYPENAME_MOTOR } from "./game.v1.blocks"
import DNA from "./game.v1.dna"
import Organism from "./game.v1.organism"
import Pool from "./game.v1.pool"
import { DNA_NODE_ROLE_APPENDAGE, DNA_NODE_ROLE_ROOT } from "./game.v1.references"

function init() {

    // Create Pool

    const currentPool = new Pool("123")

    // Create default organism

    const organismDna = new DNA(
        DNA_NODE_ROLE_ROOT,
        BLOCK_TYPENAME_HEART,
        [
            new DNA(),
            new DNA(),
            new DNA(),
            new DNA(),
            new DNA(),
            new DNA(
                DNA_NODE_ROLE_APPENDAGE,
                BLOCK_TYPENAME_MOTOR
            )
        ]
    )
    const organism = new Organism(organismDna)
    currentPool.addOrganism(organism)

    console.log(currentPool)

    // Update loop
    const UPS = 12
    setInterval(() => {
        currentPool.updateLife()
    }, 1000 / UPS)
}

export { init }