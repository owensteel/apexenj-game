/*

    Blocks

    Provides a library of blocks (properties and functions) for nodes
    in the form of classes.

*/

// Types of block the player can use
const PlayerAccessibleBlockTypeNamesList = []

/*

    Default

*/

const BLOCK_TYPENAME_DEFAULT = "default"
class DefaultBlock {
    constructor() {
        this.typeName = BLOCK_TYPENAME_DEFAULT
        this.color = "red"
        this.symbol = ""
    }
    setTypeName(typeName) {
        this.typeName = typeName
    }
    setColor(color) {
        this.color = color
    }
    setSymbol(symbol) {
        this.symbol = symbol
    }
}
PlayerAccessibleBlockTypeNamesList.push("default")

/*

    Bonding

*/

// NOTE: Bonding is currently disabled.
const BLOCK_TYPENAME_BONDING = "bonding"
class BondingBlock extends DefaultBlock {
    constructor() {
        super();
        this.to = 0
        this.strength = 0

        this.setTypeName(BLOCK_TYPENAME_BONDING)
        this.setColor("lightgreen")
    }
}

/*

    Motor

*/

const BLOCK_TYPENAME_MOTOR = "motor"
class MotorBlock extends DefaultBlock {
    constructor() {
        super();
        this.isMotor = true
        this.speed = 0 /* (angle / sec) */

        this.setTypeName(BLOCK_TYPENAME_MOTOR)
        this.setColor("yellow")
    }
}
PlayerAccessibleBlockTypeNamesList.push(BLOCK_TYPENAME_MOTOR)

/*

    Heart

*/

const BLOCK_TYPENAME_HEART = "heart"
class HeartBlock extends DefaultBlock {
    constructor() {
        super();
        this.isHeart = true

        this.setTypeName(BLOCK_TYPENAME_HEART)
        this.setColor("pink")
    }
}

/*

    Detaching

*/

const BLOCK_TYPENAME_DETACHING = "detaching"
class DetachingBlock extends DefaultBlock {
    constructor() {
        super();

        this.setTypeName(BLOCK_TYPENAME_DETACHING)
        this.setColor("blue")
    }
}
PlayerAccessibleBlockTypeNamesList.push(BLOCK_TYPENAME_DETACHING)

// Type name to instance
function getBlockInstanceFromTypeName(typeName) {
    switch (typeName) {
        case BLOCK_TYPENAME_BONDING:
            return new BondingBlock()
        case BLOCK_TYPENAME_MOTOR:
            return new MotorBlock()
        case BLOCK_TYPENAME_DETACHING:
            return new DetachingBlock()
        default:
            return new DefaultBlock()
    }
}

export {

    // Block classes

    DefaultBlock,
    BondingBlock,
    MotorBlock,
    HeartBlock,
    DetachingBlock,

    // List of accessible block IDs

    PlayerAccessibleBlockTypeNamesList,

    // Block type constants

    BLOCK_TYPENAME_DEFAULT,
    BLOCK_TYPENAME_BONDING,
    BLOCK_TYPENAME_HEART,
    BLOCK_TYPENAME_MOTOR,
    BLOCK_TYPENAME_DETACHING,

    // For converting block type names to instances

    getBlockInstanceFromTypeName
}