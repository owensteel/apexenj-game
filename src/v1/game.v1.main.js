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

const DefaultDNA = new DNA(
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

        let builderPresetDNA = DefaultDNA

        // Restore last Organism player built for this Pool
        const lastBuiltOrganismCookieKey = `last_built_organism.${this.currentPool.id}`
        if (lastBuiltOrganismCookieKey in window.localStorage) {
            const lastBuiltOrganismStaticDNA = JSON.parse(window.localStorage.getItem(lastBuiltOrganismCookieKey))
            builderPresetDNA = new DNA().fromStaticObject(lastBuiltOrganismStaticDNA)
        }

        this.builderUi = new DNABuilderUI(
            builderPresetDNA,
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
        // Only if manually turned on

        const autosaveLoop = () => {
            this.currentPool.saveStateToServer(true)
            this.currentPool.saveThumbnailToServer()
            setTimeout(autosaveLoop, AUTOSAVE_INTERVAL_SECS * 1000)
        }
        if (this.enableOfflineAutosave && !this.multiplayerClient) {
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
        statusBar.innerHTML = `<status-mode>${this.multiplayerClient ? "MULTIPLAYER" : "SANDBOX"}</status-mode>: ${this.currentPool.id}`
        this.gameWrapper.appendChild(statusBar)
    }
}

export default Main