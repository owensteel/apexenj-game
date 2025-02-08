/*

    Main

*/

import { BLOCK_TYPENAME_HEART } from "./game.v1.blocks"
import DNA from "./game.v1.dna"
import Pool from "./game.v1.pool"
import { DNA_NODE_ROLE_ROOT, UPDATES_PER_SEC } from "./game.v1.references"
import DNABuilderUI from "./game.v1.dna.builder.ui"
import MultiplayerClient from "./game.v1.multiplayerClient"

class Main {
    constructor(
        presetPoolData,
        multiplayerClient
    ) {
        // Multiplayer (if provided)
        this.multiplayerClient = multiplayerClient
        if (multiplayerClient && !(multiplayerClient instanceof MultiplayerClient)) {
            throw new Error("If in multiplayer mode, the Multiplayer Client must be provided")
        }

        // Setup pool
        this.presetPoolData = presetPoolData

        // Grab canvas
        this.gameWrapper = document.getElementById("game-wrapper")

        // Create or open Pool
        if (this.presetPoolData) {
            this.currentPool = new Pool(
                this.presetPoolData.id,
                this.presetPoolData.organisms,
                this.presetPoolData.timeSync
            )
        } else {
            this.currentPool = new Pool()
        }

        this.init()
    }
    init() {
        const currentPool = this.currentPool

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
            currentPool,
            this.multiplayerClient
        )
        this.gameWrapper.appendChild(builderUi.builderWrapper)
        builderUi.initDOM()

        // Rendering
        // Offline only; in multiplayer mode, only the host
        // renders and the clients are updated to its state

        if (!this.multiplayerClient) {
            const renderUpdateLoop = () => {
                // Update
                currentPool.updateLife()
                setTimeout(() => {
                    renderUpdateLoop()
                }, 1000 / UPDATES_PER_SEC)
            }
            renderUpdateLoop()
        }
    }
}

export default Main