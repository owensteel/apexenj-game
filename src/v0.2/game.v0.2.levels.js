/*

    Levels

*/

import * as Food from "./game.v0.2.food"
import * as Organisms from "./game.v0.2.organisms"
import { newDnaNodeFromImport } from "./game.v0.2.dna"
import { cloneObject } from "./game.v0.2.utils"
import { stageEdges3D } from "./game.v0.2.3d"

import defaultEnemyDNA from "./preset_dna/default_enemies/1.json"
import defaultEnemy2DNA from "./preset_dna/default_enemies/2.json"

const foodRingRadius = 50
const foodRingNumOfItems = 6

class Level {
    constructor(presetSeed = null) {
        // Features
        this.plants = []
        this.food = []

        // Leaderboard system
        this.leaderboard = [
            defaultEnemy2DNA,
            defaultEnemyDNA
        ]
        // The stage (enemy) to feature
        // when this level is next init
        // (reset every combat series)
        this.leaderboardCurrentStage = 0
        // The progress of the player in
        // this level's leaderboard
        this.leaderboardProgress = 0

        // Player (defined centrally)
        this.playerOrganism = null

        // Enemy values (to be initialised)
        this.enemyDna = null
        this.enemyOrganism = null

        // Initialise
        this.reset()
    }
    reset() {
        console.log("level reset")

        // Clear any old things
        if (this.enemyOrganism) {
            this.enemyOrganism.die()
        }
        if (this.food.length > 0) {
            this.food.forEach((fO) => { fO.die() })
        }

        // Enemy
        this.enemyDna = newDnaNodeFromImport(
            this.leaderboard[this.leaderboardCurrentStage]
        )
        this.enemyOrganism = Organisms.addOrganism(
            cloneObject(this.enemyDna),
            {
                x: 0,
                y: stageEdges3D.top.right.y * 0.75
            }
        )

        // Initialise appearance
        this.enemyOrganism.mesh.rotation.z = Math.atan2(
            this.enemyOrganism.combatStartPos.x,
            -this.enemyOrganism.combatStartPos.y
        )

        // Selected food types
        const foodTypesInLevel = [
            Food.FOOD_SEQ_TYPE_B,
            Food.FOOD_SEQ_TYPE_E
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