/*

    Main

*/

import { BLOCK_TYPENAME_HEART, BLOCK_TYPENAME_PLANT, BLOCK_TYPENAME_FOOD } from "./game.v1.blocks"
import DNA from "./game.v1.dna"
import Pool from "./game.v1.pool"
import { DNA_NODE_ROLE_APPENDAGE, DNA_NODE_ROLE_ROOT, GAME_MODE_PLAY, GAME_MODE_SANDBOX, UPDATES_PER_SEC } from "./game.v1.references"
import DNABuilderUI from "./game.v1.dna.builder.ui"
import MultiplayerClient from "./game.v1.multiplayerClient"
import PlayerAccount from "../services/PlayerAccount"

const AUTOSAVE_INTERVAL_SECS = 5

// Default DNA for Builder

const DefaultDNA = {}
DefaultDNA[GAME_MODE_PLAY] = new DNA(
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
DefaultDNA[GAME_MODE_SANDBOX] = new DNA(
    DNA_NODE_ROLE_ROOT,
    BLOCK_TYPENAME_HEART,
    [
        new DNA(
            DNA_NODE_ROLE_APPENDAGE,
            BLOCK_TYPENAME_FOOD
        ),
        new DNA(
            DNA_NODE_ROLE_APPENDAGE,
            BLOCK_TYPENAME_PLANT
        ),
        new DNA(
            DNA_NODE_ROLE_APPENDAGE,
            BLOCK_TYPENAME_FOOD
        ),
        new DNA(
            DNA_NODE_ROLE_APPENDAGE,
            BLOCK_TYPENAME_PLANT
        ),
        new DNA(
            DNA_NODE_ROLE_APPENDAGE,
            BLOCK_TYPENAME_FOOD
        ),
        new DNA(
            DNA_NODE_ROLE_APPENDAGE,
            BLOCK_TYPENAME_PLANT
        )
    ]
)

class Main {
    constructor(
        presetPoolData,
        multiplayerClient,
        playerAccount,
        gameMode = GAME_MODE_PLAY
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

        // Set game mode
        this.gameMode = gameMode
        if (gameMode !== GAME_MODE_PLAY && gameMode !== GAME_MODE_SANDBOX) {
            throw new Error("Invalid Game Mode specified")
        }

        // Setup pool
        this.presetPoolData = presetPoolData

        // Create or open Pool
        if (this.presetPoolData) {
            this.currentPool = new Pool(
                this.presetPoolData.id,
                [],
                !(!this.multiplayerClient),
                this.gameMode
            )
            this.currentPool.syncWithServerState(presetPoolData)
            // Game exists/"has been created on server"
            // This allows autosave
            this.currentPool.hasBeenCreatedOnServer = true
        } else {
            this.currentPool = new Pool(
                null,
                [],
                !(!this.multiplayerClient),
                this.gameMode
            )
        }

        // Grab canvas
        this.gameWrapper = document.getElementById("game-wrapper")

        // Init Builder UI

        let builderPresetDNA = DefaultDNA[this.gameMode]

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
            this.playerAccount,
            this.gameMode
        )

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
        // Only while offline

        const autosaveLoop = () => {
            // Only autosave if the game actually
            // exists in the first place — otherwise
            // we're saving nothing
            if (this.currentPool.hasBeenCreatedOnServer) {
                this.currentPool.saveStateToServer(true)
            }
            setTimeout(autosaveLoop, AUTOSAVE_INTERVAL_SECS * 1000)
        }
        if (!this.multiplayerClient) {
            setTimeout(autosaveLoop, AUTOSAVE_INTERVAL_SECS * 1000)
        }

        // Thumbnail autosave
        // Automatically updates thumbnail on server while game is running

        const thumbAutosaveLoop = () => {
            // Only autosave if the game actually
            // exists in the first place — otherwise
            // we're saving for nothing
            if (this.currentPool.hasBeenCreatedOnServer) {
                this.currentPool.saveThumbnailToServer(true)
            }
            setTimeout(thumbAutosaveLoop, AUTOSAVE_INTERVAL_SECS * 1000)
        }
        // Only be the controller of thumbnail autosave if we are offline
        // or the host in multiplayer mode
        if (!this.multiplayerClient ||
            (this.multiplayerClient && this.multiplayerClient.role == "host")) {
            setTimeout(thumbAutosaveLoop, AUTOSAVE_INTERVAL_SECS * 1000)
        }
    }
    displayUI() {
        // Set up Builder UI

        this.gameWrapper.appendChild(this.builderUi.builderWrapper)
        this.builderUi.initDOM()

        // Display game status

        const statusBar = document.createElement("game-status-bar")
        // TODO: Provide string constants
        statusBar.innerHTML = `<status-mode>${this.multiplayerClient ? "MULTIPLAYER" : "SANDBOX"}</status-mode>`
        //this.gameWrapper.appendChild(statusBar)
    }
}

export default Main