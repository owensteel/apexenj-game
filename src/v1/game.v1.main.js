/*

    Main

*/

import { BLOCK_TYPENAME_HEART, BLOCK_TYPENAME_MOTOR } from "./game.v1.blocks"
import DNA from "./game.v1.dna"
import Organism from "./game.v1.organism"
import Pool from "./game.v1.pool"
import { DNA_NODE_ROLE_APPENDAGE, DNA_NODE_ROLE_ROOT } from "./game.v1.references"

class Main {
    constructor(presetPoolData) {
        this.presetPoolData = presetPoolData

        // Grab canvas
        this.gameWrapper = document.getElementById("game-wrapper")

        // Create or open Pool
        if (this.presetPoolData) {
            this.currentPool = new Pool(
                this.presetPoolData.id,
                this.presetPoolData.organisms
            )
        } else {
            this.currentPool = new Pool()
        }

        this.init()
    }
    init() {
        const currentPool = this.currentPool

        // Demo DNA

        const demoDna = new DNA(
            DNA_NODE_ROLE_ROOT,
            BLOCK_TYPENAME_HEART,
            [
                new DNA(),
                new DNA(),
                new DNA(),
                new DNA(
                    DNA_NODE_ROLE_APPENDAGE,
                    BLOCK_TYPENAME_MOTOR
                ),
                new DNA(),
                new DNA(
                    DNA_NODE_ROLE_APPENDAGE,
                    BLOCK_TYPENAME_MOTOR
                )
            ]
        )

        // Create demo organisms

        const organism1 = new Organism(
            // Clone demo
            new DNA(
                demoDna.role,
                demoDna.block.typeName,
                demoDna.children
            )
        )
        currentPool.addOrganism(organism1)

        // Update loop

        const UPDATES_PER_SEC = 24
        function updateLoop() {
            currentPool.updateLife()
            setTimeout(updateLoop, 1000 / UPDATES_PER_SEC)
        }
        updateLoop()

        // Debug log

        console.log(currentPool)
        window.cL = currentPool
    }
}

export default Main