/*

    Ecosystems

*/

import * as ThreeElements from './game.v0.2.3d'
import * as Plants from "./game.v0.2.plants"

const plantPositions = [
    // Top left
    {
        x: ThreeElements.stageEdges3D.top.left.x,
        y: ThreeElements.stageEdges3D.top.left.y
    },
    // Top centre
    {
        x: 0,
        y: ThreeElements.stageEdges3D.top.left.y
    },
    // Top right
    {
        x: ThreeElements.stageEdges3D.top.right.x,
        y: ThreeElements.stageEdges3D.top.right.y
    },
    // Bottom left
    {
        x: ThreeElements.stageEdges3D.bottom.left.x,
        y: ThreeElements.stageEdges3D.bottom.left.y
    },
    // Bottom centre
    {
        x: 0,
        y: ThreeElements.stageEdges3D.bottom.left.y
    },
    // Bottom right
    {
        x: ThreeElements.stageEdges3D.bottom.right.x,
        y: ThreeElements.stageEdges3D.bottom.right.y
    }
]

class Ecosystem {
    constructor(presetSeed = null) {
        this.plants = []
        this.temperature = 0
        this.backgroundColor = "PaleGreen"

        if (presetSeed == null) {

            for (const plantPosition of plantPositions) {

                const plant = Plants.createPlant()

                plant.combatStartPos.x = plantPosition.x
                plant.combatStartPos.y = plantPosition.y

                this.plants.push(plant)

            }

        }
    }
}

export { Ecosystem }