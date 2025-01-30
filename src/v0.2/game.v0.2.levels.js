/*

    Levels

*/

import * as Food from "./game.v0.2.food"
import * as Blocks from "./game.v0.2.blocks"
import * as Organisms from "./game.v0.2.organisms"
import { dnaNode } from "./game.v0.2.dna"
import { cloneObject } from "./game.v0.2.utils"
import { stageEdges3D } from "./game.v0.2.3d"

const foodRingRadius = 50
const foodRingNumOfItems = 6

class Level {
    constructor(presetSeed = null) {
        // Features
        this.plants = []
        this.food = []
        this.temperature = 0

        // Player (defined centrally)
        this.playerOrganism = null

        // Enemy values (to be initialised)
        this.enemyDna = null
        this.enemyOrganism = null

        this.init()
    }
    init() {
        // Enemy
        this.enemyDna = new dnaNode(
            "root",
            new Blocks.HeartBlock(),
            [
                new dnaNode(
                    "appendage",
                    new Blocks.DefaultBlock(),
                    []
                ),
                new dnaNode(
                    "appendage",
                    new Blocks.DefaultBlock(),
                    []
                ),
                new dnaNode(
                    "appendage",
                    new Blocks.DefaultBlock(),
                    []
                ),
                new dnaNode(
                    "appendage",
                    new Blocks.DefaultBlock(),
                    []
                ),
                new dnaNode(
                    "appendage",
                    new Blocks.DefaultBlock(),
                    []
                ),
                new dnaNode(
                    "appendage",
                    new Blocks.DefaultBlock(),
                    []
                )
            ]
        )
        this.enemyOrganism = Organisms.addOrganism(
            cloneObject(this.enemyDna),
            {
                x: 0,
                y: stageEdges3D.top.right.y * 0.75
            }
        )

        // Selected food types
        const foodTypesInLevel = [
            Food.FOOD_SEQ_TYPE_B,
            Food.FOOD_SEQ_TYPE_C
        ]

        // Rings of food around organisms
        foodTypesInLevel.forEach((foodTypeId, fI) => {
            // One ring per food type
            const ringRadius = foodRingRadius * (fI + 1)
            for (let rI = 0; rI < foodRingNumOfItems; rI++) {
                const foodStartPos = {
                    x: Math.cos(
                        rI * (Math.PI / (foodRingNumOfItems / 2))
                    ) * ringRadius,
                    y: Math.sin(
                        rI * (Math.PI / (foodRingNumOfItems / 2))
                    ) * ringRadius
                }
                const foodItem = Food.createFood(
                    foodStartPos, foodTypeId
                )
                foodItem.velocity.x = Food.foodVelocity * Math.sign(foodStartPos.x)
                foodItem.velocity.y = Food.foodVelocity * Math.sign(foodStartPos.y)

                this.food.push(foodItem)
            }
        })
    }
}

export { Level }