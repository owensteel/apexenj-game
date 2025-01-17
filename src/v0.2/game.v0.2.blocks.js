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

    Attractor blocks

*/

const BLOCK_TYPENAME_ATTRACTOR = "attractor"
class AttractorBlock extends DefaultBlock {
    constructor() {
        super();
        this.targetBlock = {}

        this.setTypeName(BLOCK_TYPENAME_ATTRACTOR)
        this.setColor("blue")
    }
    setTargetBlock(targetBlock) {
        this.targetBlock = targetBlock
    }
}
// NOTE: AttractorBlock on its own is unusable.

const BLOCK_ATTRACTOR_TYPEID_ALPHA = "attractor-alpha"
class AttractorAlphaBlock extends AttractorBlock {
    constructor() {
        super();

        this.setSymbol("α")
        this.setTargetBlock({
            typeName: "default"
        })
    }
}
PlayerAccessibleBlockTypeNamesList.push(BLOCK_ATTRACTOR_TYPEID_ALPHA)

const BLOCK_ATTRACTOR_TYPEID_BETA = "attractor-beta"
class AttractorBetaBlock extends AttractorBlock {
    constructor() {
        super();

        this.setSymbol("β")
        this.setTargetBlock({
            typeName: "default"
        })
    }
}
PlayerAccessibleBlockTypeNamesList.push(BLOCK_ATTRACTOR_TYPEID_BETA)

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
        this.healthbar = 100

        this.setTypeName(BLOCK_TYPENAME_HEART)
        this.setColor("pink")
    }
}

export {

    // Block classes

    DefaultBlock,
    BondingBlock,
    MotorBlock,
    HeartBlock,
    AttractorAlphaBlock,
    AttractorBetaBlock,

    // List of accessible block IDs

    PlayerAccessibleBlockTypeNamesList,

    // Block type constants

    BLOCK_TYPENAME_DEFAULT,
    BLOCK_TYPENAME_ATTRACTOR,
    BLOCK_TYPENAME_BONDING,
    BLOCK_TYPENAME_HEART,
    BLOCK_TYPENAME_MOTOR,

    // Attractor type constants

    BLOCK_ATTRACTOR_TYPEID_ALPHA,
    BLOCK_ATTRACTOR_TYPEID_BETA
}