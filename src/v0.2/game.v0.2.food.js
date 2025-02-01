/*

    Food

*/

import * as ThreeElements from './game.v0.2.3d'
import * as DNA from './game.v0.2.dna'
import * as Organism from './game.v0.2.organisms'
import * as Blocks from './game.v0.2.blocks'
import { cloneObject } from './game.v0.2.utils'

import foodDnaTypeA from './preset_dna/food/type_a.json'
import foodDnaTypeB from './preset_dna/food/type_b.json'
import foodDnaTypeC from './preset_dna/food/type_c.json'
import foodDnaTypeD from './preset_dna/food/type_d.json'
import foodDnaTypeE from './preset_dna/food/type_e.json'
import foodDnaTypeF from './preset_dna/food/type_f.json'

// Different shapes of food

const foodSequences = {}

const FOOD_SEQ_TYPE_A = "FOOD_SEQ_TYPE_A"
foodSequences[FOOD_SEQ_TYPE_A] = DNA.newDnaNodeFromImport(foodDnaTypeA)

const FOOD_SEQ_TYPE_B = "FOOD_SEQ_TYPE_B"
foodSequences[FOOD_SEQ_TYPE_B] = DNA.newDnaNodeFromImport(foodDnaTypeB)

const FOOD_SEQ_TYPE_C = "FOOD_SEQ_TYPE_C"
foodSequences[FOOD_SEQ_TYPE_C] = DNA.newDnaNodeFromImport(foodDnaTypeC)

const FOOD_SEQ_TYPE_D = "FOOD_SEQ_TYPE_D"
foodSequences[FOOD_SEQ_TYPE_D] = DNA.newDnaNodeFromImport(foodDnaTypeD)

const FOOD_SEQ_TYPE_E = "FOOD_SEQ_TYPE_E"
foodSequences[FOOD_SEQ_TYPE_E] = DNA.newDnaNodeFromImport(foodDnaTypeE)

const FOOD_SEQ_TYPE_F = "FOOD_SEQ_TYPE_F"
foodSequences[FOOD_SEQ_TYPE_F] = DNA.newDnaNodeFromImport(foodDnaTypeF)

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

    // Set food nutrition value depending on
    // amount of food blocks instance has
    const foodBlockNodes = foodInstance.nodePositions.filter((nodePos) => {
        return nodePos.node.block.typeName == Blocks.BLOCK_TYPENAME_FOOD
    })
    foodInstance.energy = nutritionPerFoodBlock * foodBlockNodes.length

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