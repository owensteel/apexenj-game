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

        // Selected food types
        const foodTypesInLevel = [
            Food.FOOD_SEQ_TYPE_A,
            Food.FOOD_SEQ_TYPE_B
        ]

        // Rings of food around organisms
        foodTypesInLevel.forEach((foodTypeId, fI) => {
            // One ring per food type
            const ringRadius = foodRingRadius * fI
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