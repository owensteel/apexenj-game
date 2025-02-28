/*

    Blocks

*/

import { GAME_MODE_PLAY, GAME_MODE_SANDBOX } from "./game.v1.references"

// Types of block the player can use

const AccessibleBlockTypeNamesByGameMode = {}
AccessibleBlockTypeNamesByGameMode[GAME_MODE_PLAY] = []
AccessibleBlockTypeNamesByGameMode[GAME_MODE_SANDBOX] = []

/*

    Default

*/

const BLOCK_TYPENAME_DEFAULT = "default"
class DefaultBlock {
    constructor() {
        // Default block settings
        this.typeName = BLOCK_TYPENAME_DEFAULT
        this.color = "#fff"
    }
    setTypeName(typeName) {
        this.typeName = typeName
    }
    setColor(color) {
        this.color = color
    }
}
AccessibleBlockTypeNamesByGameMode[GAME_MODE_PLAY].push("default")

/*

    Default but for plants

*/

const BLOCK_TYPENAME_PLANT = "plant"
class PlantBlock extends DefaultBlock {
    constructor() {
        super()
        this.setTypeName(BLOCK_TYPENAME_PLANT)
        this.setColor("DarkViolet")
    }
}
AccessibleBlockTypeNamesByGameMode[GAME_MODE_SANDBOX].push(BLOCK_TYPENAME_PLANT)

/*

    Motor

*/

const BLOCK_TYPENAME_MOTOR = "motor"
class MotorBlock extends DefaultBlock {
    constructor() {
        super()
        this.isMotor = true
        this.appliedPowerPerc = 1 /* Perc of max power, 0 - 1 */
        this.setTypeName(BLOCK_TYPENAME_MOTOR)
        this.setColor("hotpink")
    }
}
AccessibleBlockTypeNamesByGameMode[GAME_MODE_PLAY].push(BLOCK_TYPENAME_MOTOR)

/*

    Heart

*/

const BLOCK_TYPENAME_HEART = "heart"
class HeartBlock extends DefaultBlock {
    constructor() {
        super()
        this.isHeart = true
        this.setTypeName(BLOCK_TYPENAME_HEART)
        this.setColor("black")
    }
}

/*

    Detaching

*/

const BLOCK_TYPENAME_DETACHING = "detaching"
class DetachingBlock extends DefaultBlock {
    constructor() {
        super()
        this.setTypeName(BLOCK_TYPENAME_DETACHING)
        this.setColor("blue")
    }
}
// NOTE: block is disabled

/*

    Food

*/

const BLOCK_TYPENAME_FOOD = "food"
class FoodBlock extends DefaultBlock {
    constructor() {
        super()
        this.setTypeName(BLOCK_TYPENAME_FOOD)
        this.setColor("Lavender")
    }
}
AccessibleBlockTypeNamesByGameMode[GAME_MODE_SANDBOX].push(BLOCK_TYPENAME_FOOD)

/*

    Absorber

*/

const BLOCK_TYPENAME_ABSORBER = "absorber"
class AbsorberBlock extends DefaultBlock {
    constructor() {
        super()
        this.setTypeName(BLOCK_TYPENAME_ABSORBER)
        this.setColor("lightgreen")
    }
}
AccessibleBlockTypeNamesByGameMode[GAME_MODE_PLAY].push(BLOCK_TYPENAME_ABSORBER)

/*

    Digester

*/

const BLOCK_TYPENAME_DIGESTER = "digester"
class DigesterBlock extends DefaultBlock {
    constructor() {
        super()
        this.setTypeName(BLOCK_TYPENAME_DIGESTER)
        this.setColor("yellow")
    }
}
AccessibleBlockTypeNamesByGameMode[GAME_MODE_PLAY].push(BLOCK_TYPENAME_DIGESTER)

// Type name to instance
function getBlockInstanceFromTypeName(typeName) {
    switch (typeName) {
        case BLOCK_TYPENAME_MOTOR:
            return new MotorBlock()
        case BLOCK_TYPENAME_DETACHING:
            return new DetachingBlock()
        case BLOCK_TYPENAME_ABSORBER:
            return new AbsorberBlock()
        case BLOCK_TYPENAME_DIGESTER:
            return new DigesterBlock()
        case BLOCK_TYPENAME_HEART:
            return new HeartBlock()
        case BLOCK_TYPENAME_FOOD:
            return new FoodBlock()
        case BLOCK_TYPENAME_PLANT:
            return new PlantBlock()
        default:
            return new DefaultBlock()
    }
}

export {

    // Block classes

    DefaultBlock,
    PlantBlock,
    MotorBlock,
    HeartBlock,
    DetachingBlock,
    FoodBlock,
    AbsorberBlock,

    // List of accessible block IDs
    // Sorted by the Game Mode in which
    // they are accessible

    AccessibleBlockTypeNamesByGameMode,

    // Block type constants

    BLOCK_TYPENAME_DEFAULT,
    BLOCK_TYPENAME_PLANT,
    BLOCK_TYPENAME_HEART,
    BLOCK_TYPENAME_MOTOR,
    BLOCK_TYPENAME_DETACHING,
    BLOCK_TYPENAME_FOOD,
    BLOCK_TYPENAME_ABSORBER,
    BLOCK_TYPENAME_DIGESTER,

    // For converting block type names to instances

    getBlockInstanceFromTypeName
}