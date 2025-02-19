/*

    Main

*/

import { BLOCK_TYPENAME_HEART } from "./game.v1.blocks"
import DNA from "./game.v1.dna"
import Pool from "./game.v1.pool"
import { DNA_NODE_ROLE_ROOT, UPDATES_PER_SEC } from "./game.v1.references"
import DNABuilderUI from "./game.v1.dna.builder.ui"
import MultiplayerClient from "./game.v1.multiplayerClient"
import PlayerAccount from "../services/PlayerAccount"

const AUTOSAVE_INTERVAL_SECS = 5

const defaultDNA = new DNA(
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

class Main {
    constructor(
        presetPoolData,
        multiplayerClient,
        playerAccount
    ) {
        // Multiplayer (if provided)
        this.multiplayerClient = multiplayerClient
        if (multiplayerClient && !(multiplayerClient instanceof MultiplayerClient)) {
            throw new Error("If in multiplayer mode, the Multiplayer Client must be provided")
        }

        // Player account (if provided)
        if (playerAccount instanceof PlayerAccount) {
            this.playerAccount = playerAccount
        } else {
            throw new Error("Player Account provided must be a valid instance")
        }

        // Setup pool
        this.presetPoolData = presetPoolData

        // Create or open Pool
        if (this.presetPoolData) {
            this.currentPool = new Pool(
                this.presetPoolData.id,
                [],
                this.presetPoolData.timeSync,
                !(!this.multiplayerClient)
            )
            this.currentPool.syncWithServerState(presetPoolData)
        } else {
            this.currentPool = new Pool(
                null,
                [],
                null,
                !(!this.multiplayerClient)
            )
        }

        // Grab canvas
        this.gameWrapper = document.getElementById("game-wrapper")

        // Init Builder UI
        const presetDNA = "lastBuiltOrganism" in window.localStorage ? window.localStorage.getItem("lastBuiltOrganism") : defaultDNA
        this.builderUi = new DNABuilderUI(
            presetDNA,
            this.currentPool,
            this.multiplayerClient,
            this.playerAccount
        )

        // Options
        this.enableOfflineAutosave = false

        // Init all
        this.init()
        this.displayUI()
    }
    init() {
        const currentPool = this.currentPool

        // TODO: REMOVE, debugging only

        window.cL = this
        console.log(window.cL)

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

        // Autosave
        // Only if manually turned on, or by default in multiplayer
        // TODO: move multiplayer autosave to server-side

        const autosaveLoop = () => {
            // Only save from this client if we are the
            // owner (offline) or the host (multiplayer)
            if (!this.multiplayerClient || this.multiplayerClient.role == "host") {
                this.currentPool.saveStateToServer(true)
            }
            setTimeout(autosaveLoop, AUTOSAVE_INTERVAL_SECS * 1000)
        }
        if (this.multiplayerClient || this.enableOfflineAutosave) {
            setTimeout(autosaveLoop, AUTOSAVE_INTERVAL_SECS * 1000)
        }
    }
    displayUI() {
        // Set up Builder UI

        this.gameWrapper.appendChild(this.builderUi.builderWrapper)
        this.builderUi.initDOM()

        // Display game status

        const statusBar = document.createElement("game-status-bar")
        // TODO: Provide string constants
        statusBar.innerHTML = `<status-mode>${this.multiplayerClient ? "MULTIPLAYER" : "OFFLINE"}</status-mode>: ${this.currentPool.id}`
        this.gameWrapper.appendChild(statusBar)
    }
}

export default Main