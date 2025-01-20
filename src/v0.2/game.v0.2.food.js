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
            ),
            new DNA.dnaNode(
                "appendage",
                new Blocks.FoodBlock(),
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
            ),
            new DNA.dnaNode(
                "appendage",
                new Blocks.FoodBlock(),
            ),
            new DNA.dnaNode(
                "appendage",
                new Blocks.FoodBlock(),
            ),
            new DNA.dnaNode(
                "appendage",
                new Blocks.FoodBlock(),
            )
        ]
    )
]

const nutritionPerFoodBlock = 0.1

// Create and deploy food
function createFood() {

    const foodInstance = Organism.addOrganism(
        cloneObject(
            foodSequences[
            Math.round(
                Math.random() *
                (foodSequences.length - 1))
            ],
            false
        ),
        {
            x: Math.random() > 0.5
                ? ThreeElements.stageEdges3D.top.left.x :
                ThreeElements.stageEdges3D.top.right.x,
            y: 0
        }
    )
    foodInstance.isFood = true
    foodInstance.velocity.x = 0.01

    // Set food nutrition value depending on
    // amount of food blocks instance has
    foodInstance.energy = nutritionPerFoodBlock * foodInstance.nodePositions.length

    console.log("created food", foodInstance)

    return foodInstance
}

export { createFood, nutritionPerFoodBlock }