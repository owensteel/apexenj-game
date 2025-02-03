/*

    DNA

*/

import * as Blocks from './game.v1.blocks'

class DNA {
    constructor(presetSequence) {
        // A sequence is always one DNA node, which
        // may or may not have children
        this.sequence = new DNANode(presetSequence)
    }
}

const DNA_NODE_ROLE_APPENDAGE = "DNA_NODE_ROLE_APPENDAGE"

class DNANode {
    constructor(presetNode) {
        this.role = DNA_NODE_ROLE_APPENDAGE
        this.block = new Blocks.DefaultBlock()
        this.children = new Array(6)

        if (presetNode) {
            this.role = presetNode.role
            this.block = Blocks.getBlockInstanceFromTypeName(
                presetNode.block.typeName
            )
            presetNode.children.forEach((presetChildNode, cI) => {
                this.children[cI] = new DNANode(presetChildNode)
            })
        }
    }
}

export default DNA