/*

    Main

*/

import { BLOCK_TYPENAME_HEART } from "./game.v1.blocks"
import DNA from "./game.v1.dna"
import Pool from "./game.v1.pool"
import { DNA_NODE_ROLE_ROOT } from "./game.v1.references"
import DNABuilderUI from "./game.v1.dna.builder.ui"

const FLAG_ENABLE_POOL_TIME_SYNC = false

class Main {
    constructor(presetPoolData) {
        this.presetPoolData = presetPoolData

        // Grab canvas
        this.gameWrapper = document.getElementById("game-wrapper")

        // Create or open Pool
        if (this.presetPoolData) {
            this.currentPool = new Pool(
                this.presetPoolData.id,
                this.presetPoolData.organisms,
                this.presetPoolData.creationTime
            )
        } else {
            this.currentPool = new Pool()
        }

        this.init()
    }
    init() {
        const currentPool = this.currentPool

        // Updates

        const UPDATES_PER_SEC = 24

        // Update Pool to current time

        if (FLAG_ENABLE_POOL_TIME_SYNC) {
            let timeDeltaSecs = Math.round(
                (Date.now() - currentPool.creationTime) / 1000
            )
            console.log("Updates to catch-up on:", timeDeltaSecs * UPDATES_PER_SEC)
            while (timeDeltaSecs > 0) {
                // Update UPS for each second since starting
                for (let uI = 0; uI < UPDATES_PER_SEC; uI++) {
                    currentPool.updateLife()
                }
                timeDeltaSecs--
            }
        }

        // Update loop

        function updateLoop() {
            currentPool.updateLife()
            setTimeout(updateLoop, 1000 / UPDATES_PER_SEC)
        }
        updateLoop()

        // Debug log

        console.log(currentPool)
        window.cL = currentPool

        // Create player DNA

        const demoDna = new DNA(
            DNA_NODE_ROLE_ROOT,
            BLOCK_TYPENAME_HEART,
            [
                new DNA(),
                new DNA(),
                new DNA(),
                new DNA(),
                new DNA(),
                new DNA()
            ]
        )

        // Set up UI

        const builderUi = new DNABuilderUI(
            demoDna,
            currentPool
        )
        this.gameWrapper.appendChild(builderUi.builderWrapper)
        builderUi.initDOM()
    }
}

export default Main