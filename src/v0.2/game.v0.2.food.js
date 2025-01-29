/*

    Food

*/

import * as ThreeElements from './game.v0.2.3d'
import * as DNA from './game.v0.2.dna'
import * as Organism from './game.v0.2.organisms'
import * as Blocks from './game.v0.2.blocks'
import { cloneObject } from './game.v0.2.utils'

// Different shapes of food

const foodSequences = {}

const FOOD_SEQ_TYPE_A = "FOOD_SEQ_TYPE_A"
foodSequences[FOOD_SEQ_TYPE_A] = (
    new DNA.dnaNode(
        "root",
        new Blocks.FoodBlock(),
        []
    )
)
const FOOD_SEQ_TYPE_B = "FOOD_SEQ_TYPE_B"
foodSequences[FOOD_SEQ_TYPE_B] = (
    new DNA.dnaNode(
        "root",
        new Blocks.FoodBlock(),
        [
            new DNA.dnaNode(
                "appendage",
                new Blocks.FoodBlock(),
            )
        ]
    )
)
const FOOD_SEQ_TYPE_C = "FOOD_SEQ_TYPE_C"
foodSequences[FOOD_SEQ_TYPE_C] = (
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
    )
)
const FOOD_SEQ_TYPE_D = "FOOD_SEQ_TYPE_D"
foodSequences[FOOD_SEQ_TYPE_D] = (
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
    )
)
const FOOD_SEQ_TYPE_E = "FOOD_SEQ_TYPE_E"
foodSequences[FOOD_SEQ_TYPE_E] = (
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
    )
)
const FOOD_SEQ_TYPE_F = "FOOD_SEQ_TYPE_F"
foodSequences[FOOD_SEQ_TYPE_F] = (
    new DNA.dnaNode(
        "root",
        new Blocks.FoodBlock(),
        [
            new DNA.dnaNode(
                "appendage",
                new Blocks.FoodBlock(),
                [
                    null,
                    new DNA.dnaNode(
                        "appendage",
                        new Blocks.PlantBlock(),
                        [
                            null,
                            null,
                            new DNA.dnaNode(
                                "appendage",
                                new Blocks.FoodBlock(),
                                [
                                    null,
                                    null,
                                    new DNA.dnaNode(
                                        "appendage",
                                        new Blocks.FoodBlock(),
                                        []
                                    )
                                ]
                            )
                        ]
                    )
                ]
            )
        ]
    )
)

const nutritionPerFoodBlock = 0.1
const foodVelocity = 0.005

// Create and deploy food
function createFood(foodStartPos = null, typeId = null) {

    if (!foodStartPos) {
        // Random pos
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
        // Random type
        typeId = Object.keys(foodSequences)[
            Math.floor(Math.random() * (Object.keys(foodSequences).length))
        ]
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

export {
    // Constants

    createFood,
    nutritionPerFoodBlock,
    foodVelocity,

    // Food type IDs

    FOOD_SEQ_TYPE_A,
    FOOD_SEQ_TYPE_B,
    FOOD_SEQ_TYPE_C,
    FOOD_SEQ_TYPE_D,
    FOOD_SEQ_TYPE_E,
    FOOD_SEQ_TYPE_F
}