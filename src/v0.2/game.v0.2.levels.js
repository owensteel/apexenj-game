/*

    Levels

*/

import * as Food from "./game.v0.2.food"

const foodRingRadius = 100
const foodRingNumOfItems = 6

class Level {
    constructor(presetSeed = null) {
        this.plants = []
        this.food = []
        this.temperature = 0

        // Rings of food around organisms
        for (const ringRadius of [foodRingRadius, foodRingRadius * 2]) {
            for (let i = 0; i < foodRingNumOfItems; i++) {
                const foodStartPos = {
                    x: Math.cos(
                        i * (Math.PI / (foodRingNumOfItems / 2))
                    ) * ringRadius,
                    y: Math.sin(
                        i * (Math.PI / (foodRingNumOfItems / 2))
                    ) * ringRadius
                }
                const foodItem = Food.createFood(
                    foodStartPos
                )
                foodItem.velocity.x = Food.foodVelocity * (Math.random() > 0.5 ? -1 : 1)
                foodItem.velocity.y = Food.foodVelocity * (Math.random() > 0.5 ? -1 : 1)

                this.food.push(foodItem)
            }
        }
    }
}

export { Level }