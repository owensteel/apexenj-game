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

class DefaultBlock {
    constructor() {
        this.typeName = "default"
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
class BondingBlock extends DefaultBlock {
    constructor() {
        super();
        this.to = 0
        this.strength = 0

        this.setTypeName("bonding")
        this.setColor("lightgreen")
    }
}

/*

    Attractor blocks

*/

class AttractorBlock extends DefaultBlock {
    constructor() {
        super();
        this.targetBlock = null

        this.setTypeName("attractor")
        this.setColor("blue")
    }
    setTargetBlock(targetBlock) {
        this.targetBlock = targetBlock
    }
}
// NOTE: AttractorBlock on its own is not accessible.

class AttractorAlphaBlock extends AttractorBlock {
    constructor() {
        super();

        this.setSymbol("α")
        this.setTargetBlock({
            typeName: "default"
        })
    }
}
PlayerAccessibleBlockTypeNamesList.push("attractor-alpha")

class AttractorBetaBlock extends AttractorBlock {
    constructor() {
        super();

        this.setSymbol("β")
        this.setTargetBlock({
            typeName: "default"
        })
    }
}
PlayerAccessibleBlockTypeNamesList.push("attractor-beta")

/*

    Motor

*/

class MotorBlock extends DefaultBlock {
    constructor() {
        super();
        this.isMotor = true
        this.speed = 0 /* (angle / sec) */

        this.setTypeName("motor")
        this.setColor("yellow")
    }
}
PlayerAccessibleBlockTypeNamesList.push("motor")

/*

    Heart

*/

class HeartBlock extends DefaultBlock {
    constructor() {
        super();
        this.isHeart = true
        this.healthbar = 100

        this.setTypeName("heart")
        this.setColor("pink")
    }
}

export {
    DefaultBlock,
    BondingBlock,
    MotorBlock,
    HeartBlock,
    AttractorAlphaBlock,
    AttractorBetaBlock,
    PlayerAccessibleBlockTypeNamesList
}