/*

    Levels

*/

import * as Food from "./game.v0.2.food"

class Level {
    constructor(presetSeed = null) {
        this.plants = []
        this.food = []
        this.temperature = 0

        // Rings of food around organisms
        for (const foodRadius of [150, 300]) {
            for (let i = 0; i < 6; i++) {
                const foodStartPos = {
                    x: Math.cos(i * (Math.PI / 3)) * foodRadius,
                    y: Math.sin(i * (Math.PI / 3)) * foodRadius
                }
                const foodItem = Food.createFood(
                    foodStartPos
                    // Type left null for now, for random food
                )
                foodItem.velocity.x = Food.foodVelocity * (Math.random() > 0.5 ? -1 : 1)
                foodItem.velocity.y = Food.foodVelocity * (Math.random() > 0.5 ? -1 : 1)

                this.food.push(foodItem)
            }
        }
    }
}

export { Level }