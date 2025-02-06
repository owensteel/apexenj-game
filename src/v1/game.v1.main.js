/*

    Main

*/

import { BLOCK_TYPENAME_HEART } from "./game.v1.blocks"
import DNA from "./game.v1.dna"
import Pool from "./game.v1.pool"
import { DNA_NODE_ROLE_ROOT } from "./game.v1.references"
import DNABuilderUI from "./game.v1.dna.builder.ui"

class Main {
    constructor(
        presetPoolData,
        multiplayerSocket,
        multiplayerRole
    ) {
        // Multiplayer (if provided)
        this.multiplayerSocket = multiplayerSocket
        if (multiplayerRole) {
            if (multiplayerRole !== "client" && multiplayerRole !== "host") {
                throw new Error("Invalid multiplayer role")
            }
        } else {
            if (this.multiplayerSocket) {
                throw new Error("Multiplayer role must be specified when in multiplayer mode")
            }
        }
        this.multiplayerRole = multiplayerRole

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
            // Host doesn't need to update through a socket
            (this.multiplayerRole == "client") ? this.multiplayerSocket : null
        )
        this.gameWrapper.appendChild(builderUi.builderWrapper)
        builderUi.initDOM()
    }
}

export default Main