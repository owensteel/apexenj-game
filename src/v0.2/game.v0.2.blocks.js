/*

    Blocks

    Provides a library of blocks (properties and functions) for nodes
    in the form of classes.

*/

// Block shapes/cuts

const BLOCK_CUTS_LIST = []

// Type constants
const BLOCK_CUT_DEFAULT = "BLOCK_CUT_DEFAULT"
BLOCK_CUTS_LIST.push(BLOCK_CUT_DEFAULT)
const BLOCK_CUT_A = "BLOCK_CUT_A"
BLOCK_CUTS_LIST.push(BLOCK_CUT_A)
const BLOCK_CUT_B = "BLOCK_CUT_B"
BLOCK_CUTS_LIST.push(BLOCK_CUT_B)
const BLOCK_CUT_C = "BLOCK_CUT_C"
BLOCK_CUTS_LIST.push(BLOCK_CUT_C)

// Complements table
const BLOCK_CUT_COMPLEMENTS = {}
BLOCK_CUT_COMPLEMENTS[BLOCK_CUT_DEFAULT] = []
BLOCK_CUT_COMPLEMENTS[BLOCK_CUT_A] = [BLOCK_CUT_DEFAULT, BLOCK_CUT_A]
BLOCK_CUT_COMPLEMENTS[BLOCK_CUT_B] = [BLOCK_CUT_C]

// Complement checker
function areBlocksComplementaryCuts(block1, block2) {
    return BLOCK_CUT_COMPLEMENTS[block1.cut].any(
        (compCutN) => compCutN === block2.cut
    )
}

// Types of block the player can use

const PlayerAccessibleBlockTypeNamesList = []

/*

    Default

*/

const BLOCK_TYPENAME_DEFAULT = "default"
class DefaultBlock {
    constructor(cut = BLOCK_CUT_DEFAULT) {
        this.cut = cut

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
    setCut(cutType) {
        this.cut = cutType
    }
}
PlayerAccessibleBlockTypeNamesList.push("default")

/*

    Default but for plants

*/

const BLOCK_TYPENAME_PLANT = "plant"
class PlantBlock extends DefaultBlock {
    constructor(cut = BLOCK_CUT_DEFAULT) {
        super(cut);

        this.setTypeName(BLOCK_TYPENAME_PLANT)
        this.setColor("DarkViolet")
    }
}

/*

    Motor

*/

const BLOCK_TYPENAME_MOTOR = "motor"
class MotorBlock extends DefaultBlock {
    constructor(cut = BLOCK_CUT_DEFAULT) {
        super(cut);

        this.isMotor = true
        this.appliedPowerPerc = 1 /* Perc of max power, 0 - 1 */

        this.setTypeName(BLOCK_TYPENAME_MOTOR)
        this.setColor("hotpink")
    }
}
PlayerAccessibleBlockTypeNamesList.push(BLOCK_TYPENAME_MOTOR)

/*

    Heart

*/

const BLOCK_TYPENAME_HEART = "heart"
class HeartBlock extends DefaultBlock {
    constructor(cut = BLOCK_CUT_DEFAULT) {
        super(cut);

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
    constructor(cut = BLOCK_CUT_DEFAULT) {
        super(cut);

        this.setTypeName(BLOCK_TYPENAME_DETACHING)
        this.setColor("blue")
    }
}
PlayerAccessibleBlockTypeNamesList.push(BLOCK_TYPENAME_DETACHING)

/*

    Food

*/

const BLOCK_TYPENAME_FOOD = "food"
class FoodBlock extends DefaultBlock {
    constructor(cut = BLOCK_CUT_DEFAULT) {
        super(cut);

        this.setTypeName(BLOCK_TYPENAME_FOOD)
        this.setColor("Lavender")
    }
}

/*

    Absorber

*/

const BLOCK_TYPENAME_ABSORBER = "absorber"
class AbsorberBlock extends DefaultBlock {
    constructor(cut = BLOCK_CUT_DEFAULT) {
        super(cut);

        this.setTypeName(BLOCK_TYPENAME_ABSORBER)
        this.setColor("lightgreen")
    }
}
PlayerAccessibleBlockTypeNamesList.push(BLOCK_TYPENAME_ABSORBER)

// Type name to instance
function getBlockInstanceFromTypeName(typeName) {
    switch (typeName) {
        case BLOCK_TYPENAME_MOTOR:
            return new MotorBlock()
        case BLOCK_TYPENAME_DETACHING:
            return new DetachingBlock()
        case BLOCK_TYPENAME_ABSORBER:
            return new AbsorberBlock()
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

    PlayerAccessibleBlockTypeNamesList,

    // Block type constants

    BLOCK_TYPENAME_DEFAULT,
    BLOCK_TYPENAME_PLANT,
    BLOCK_TYPENAME_HEART,
    BLOCK_TYPENAME_MOTOR,
    BLOCK_TYPENAME_DETACHING,
    BLOCK_TYPENAME_FOOD,
    BLOCK_TYPENAME_ABSORBER,

    // For converting block type names to instances

    getBlockInstanceFromTypeName,

    // Block cut constants

    BLOCK_CUTS_LIST,
    BLOCK_CUT_COMPLEMENTS,

    BLOCK_CUT_DEFAULT,
    BLOCK_CUT_A,
    BLOCK_CUT_B,
    BLOCK_CUT_C,

    // For checking if two blocks complement each
    // other in cut shape

    areBlocksComplementaryCuts
}