/*

    Food

*/

import * as ThreeElements from './game.v0.2.3d'
import * as DNA from './game.v0.2.dna'
import * as Organism from './game.v0.2.organisms'
import * as Blocks from './game.v0.2.blocks'
import { cloneObject } from './game.v0.2.utils'

// Different shapes of food
const foodSequences = [
    new DNA.dnaNode(
        "root",
        new Blocks.FoodBlock(),
        []
    ),
    new DNA.dnaNode(
        "root",
        new Blocks.FoodBlock(),
        [
            new DNA.dnaNode(
                "appendage",
                new Blocks.FoodBlock(),
            )
        ]
    ),
    new DNA.dnaNode(
        "root",
        new Blocks.FoodBlock(),
        [
            new DNA.dnaNode(
                "appendage",
                new Blocks.PlantBlock(),
            ),
            new DNA.dnaNode(
                "appendage",
                new Blocks.FoodBlock(),
            )
        ]
    ),
    new DNA.dnaNode(
        "root",
        new Blocks.FoodBlock(),
        [
            new DNA.dnaNode(
                "appendage",
                new Blocks.PlantBlock(),
            ),
            new DNA.dnaNode(
                "appendage",
                new Blocks.FoodBlock(),
                [
                    null,
                    new DNA.dnaNode(
                        "appendage",
                        new Blocks.FoodBlock(),
                    )
                ]
            )
        ]
    ),
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
                        new Blocks.FoodBlock(),
                        [
                            new DNA.dnaNode(
                                "appendage",
                                new Blocks.FoodBlock(),
                            )
                        ]
                    )
                ]
            ),
            new DNA.dnaNode(
                "appendage",
                new Blocks.FoodBlock(),
            )
        ]
    ),
    new DNA.dnaNode(
        "root",
        new Blocks.FoodBlock(),
        [
            new DNA.dnaNode(
                "appendage",
                new Blocks.FoodBlock(),
                [
                    new DNA.dnaNode(
                        "appendage",
                        new Blocks.PlantBlock(),
                    )
                ]
            ),
            new DNA.dnaNode(
                "appendage",
                new Blocks.FoodBlock(),
                [
                    new DNA.dnaNode(
                        "appendage",
                        new Blocks.FoodBlock(),
                        [
                            new DNA.dnaNode(
                                "appendage",
                                new Blocks.FoodBlock(),
                            )
                        ]
                    )
                ]
            )
        ]
    )
]

const nutritionPerFoodBlock = 0.1
const foodVelocity = 0.005

// Create and deploy food
function createFood(foodStartPos = null, typeId = null) {

    if (!foodStartPos) {
        foodStartPos = {
            x: Math.random() > 0.5
                ? ThreeElements.stageEdges3D.top.left.x :
                ThreeElements.stageEdges3D.top.right.x,
            y: Math.random() > 0.5
                ? ThreeElements.stageEdges3D.bottom.left.x :
                ThreeElements.stageEdges3D.bottom.right.x,
        }
    }
    if (!typeId) {
        typeId = Math.floor(Math.random() * (foodSequences.length - 1))
    }

    const foodInstance = Organism.addOrganism(
        cloneObject(
            foodSequences[typeId],
            false
        ),
        foodStartPos
    )
    foodInstance.isFood = true
    foodInstance.isEaten = false

    // Default velocity
    foodInstance.velocity.x = foodVelocity
    foodInstance.velocity.y = -foodVelocity
    foodInstance.mesh.rotation.z = Math.atan2(
        0 - foodInstance.mesh.position.x,
        0 - foodInstance.mesh.position.y
    )

    // Set food nutrition value depending on
    // amount of food blocks instance has
    const foodBlockNodes = foodInstance.nodePositions.filter((nodePos) => {
        return nodePos.node.block.typeName == Blocks.BLOCK_TYPENAME_FOOD
    })
    foodInstance.energy = nutritionPerFoodBlock * foodBlockNodes.length

    console.log("created food")

    return foodInstance
}

export { createFood, nutritionPerFoodBlock, foodVelocity }