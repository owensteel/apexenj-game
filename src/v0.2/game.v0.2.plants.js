/*

    Plants

*/

import * as ThreeElements from './game.v0.2.3d'
import * as DNA from './game.v0.2.dna'
import * as Organism from './game.v0.2.organisms'
import * as Blocks from './game.v0.2.blocks'
import { cloneObject } from './game.v0.2.utils'
import { nutritionPerFoodBlock } from './game.v0.2.food'

// Different plant shapes
const plantSequences = [
    new DNA.dnaNode(
        "root",
        new Blocks.FoodBlock(),
        [
            new DNA.dnaNode(
                "appendage",
                new Blocks.PlantBlock(),
                [
                    new DNA.dnaNode(
                        "appendage",
                        new Blocks.AbsorberBlock(),
                        []
                    )
                ]
            ),
            new DNA.dnaNode(
                "appendage",
                new Blocks.PlantBlock(),
                []
            ),
            new DNA.dnaNode(
                "appendage",
                new Blocks.FoodBlock(),
                []
            ),
            new DNA.dnaNode(
                "appendage",
                new Blocks.PlantBlock(),
                [
                    new DNA.dnaNode(
                        "appendage",
                        new Blocks.AbsorberBlock(),
                        []
                    )
                ]
            ),
            new DNA.dnaNode(
                "appendage",
                new Blocks.FoodBlock(),
                []
            ),
            new DNA.dnaNode(
                "appendage",
                new Blocks.PlantBlock(),
                []
            ),
        ]
    )
]

// Create and deploy plants
function createPlant() {

    const plantDNA = cloneObject(plantSequences[
        Math.round(
            Math.random() *
            (plantSequences.length - 1))
    ], false)

    const plantInstance = Organism.addOrganism(
        plantDNA,
        {
            x: Math.random() > 0.5
                ? ThreeElements.stageEdges3D.top.left.x :
                ThreeElements.stageEdges3D.top.right.x,
            y: Math.random() > 0.5
                ? ThreeElements.stageEdges3D.top.left.y :
                ThreeElements.stageEdges3D.bottom.right.y,
        }
    )
    plantInstance.isPlant = true
    plantInstance.velocity.x = 0
    plantInstance.velocity.y = 0

    // Set food nutrition value depending on
    // amount of food blocks instance has
    const foodBlockNodes = plantInstance.nodePositions.filter((nodePos) => {
        return nodePos.node.block.typeName == Blocks.BLOCK_TYPENAME_FOOD
    })
    plantInstance.energy = nutritionPerFoodBlock * foodBlockNodes.length

    console.log("created plant", plantInstance)

    return plantInstance
}

export { createPlant }