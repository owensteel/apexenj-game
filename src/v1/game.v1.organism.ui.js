/*

    UI for any organism

*/

import Organism from "./game.v1.organism";
import { UPDATES_PER_SEC } from "./game.v1.references";

const UI_SYNC_BACKLOG_EVENT_TYPE_ID_ATEFOOD = "UI_SYNC_BACKLOG_EVENT_TYPE_ID_ATEFOOD"

class OrganismUI {
    constructor(organism, shouldBacklogEvents = false) {
        if (!(organism instanceof Organism)) {
            throw new Error("Organism UI must have Organism to reference")
        }
        this.organism = organism
        this.organismUiContainer = document.createElement("organism-ui-container")

        // Use single element to contain UI for this Organism
        const gameStageWrapper = document.getElementsByTagName("game-stage-wrapper")[0]
        gameStageWrapper.appendChild(this.organismUiContainer)

        // Keep Organism UI hovering over Organism
        const updateOrganismUiPos = () => {
            if (this.organism.body) {
                const domPosOfOrg = {
                    x: (gameStageWrapper.clientWidth / 2) +
                        this.organism.body.mesh.position.x,
                    y: (gameStageWrapper.clientHeight / 2) -
                        this.organism.body.mesh.position.y
                }
                this.organismUiContainer.style.left = domPosOfOrg.x
                this.organismUiContainer.style.top = domPosOfOrg.y
            }

            setTimeout(updateOrganismUiPos, 1000 / UPDATES_PER_SEC)
        }
        updateOrganismUiPos()

        // UI backlog so clients can sync UI events with host
        // during multiplayer
        // Should be cleared after every host sync
        this.shouldBacklogEvents = shouldBacklogEvents
        this.syncBacklog = []
    }
    async applyGamerTag() {
        const gTe = document.createElement("organism-ui-gamertag")
        this.organismUiContainer.appendChild(gTe)
        if (this.organism.creator) {
            // Refresh here to prevent race condition from init
            await this.organism.creator.refreshProfile()
            gTe.innerHTML = this.organism.creator.name
        } else {
            // Handle anonymous
            gTe.innerHTML = "Anonymous"
        }
    }
    ateFood() {
        const aFd = document.createElement("organism-ui-atefood")
        this.organismUiContainer.appendChild(aFd)

        // Remove after CSS animation completes
        setTimeout(() => {
            aFd.remove()
        }, 1250)

        // Add to backlog to update any clients
        if (this.shouldBacklogEvents) {
            this.syncBacklog.push({
                type: UI_SYNC_BACKLOG_EVENT_TYPE_ID_ATEFOOD
            })
        }
    }
    processSyncBacklog(importedSyncBacklog) {
        for (const uiEvent of importedSyncBacklog) {
            switch (uiEvent.type) {
                case UI_SYNC_BACKLOG_EVENT_TYPE_ID_ATEFOOD:
                    this.ateFood()
                    break;
            }
        }
    }
}

export default OrganismUI