/*

    UI for any organism

*/

import Organism from "./game.v1.organism";
import { UPDATES_PER_SEC } from "./game.v1.references";

class OrganismUI {
    constructor(organism) {
        if (!(organism instanceof Organism)) {
            throw new Error("Organism UI must have Organism to reference")
        }
        this.organism = organism
        this.organismUiContainer = document.createElement("organism-ui-container")

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
    }
    applyGamerTag() {
        const gTe = document.createElement("organism-ui-gamertag")
        gTe.innerHTML = this.organism.author.username
        this.organismUiContainer.appendChild(gTe)
    }
    ateFood() {
        const aFd = document.createElement("organism-ui-atefood")
        this.organismUiContainer.appendChild(aFd)

        // Remove after CSS animation completes
        setTimeout(() => {
            aFd.remove()
        }, 1250)
    }
}

export default OrganismUI