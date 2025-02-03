/*

    DNA

*/

import * as Blocks from './game.v1.blocks'

const DNA_NODE_ROLE_APPENDAGE = "DNA_NODE_ROLE_APPENDAGE"

class DNA {
    constructor(presetNode) {
        // Default values
        this.role = DNA_NODE_ROLE_APPENDAGE
        this.block = new Blocks.DefaultBlock()
        this.children = new Array(6)
        this.detach = false

        // Update to any preset if needed
        if (presetNode) {
            this.role = presetNode.role
            this.block = Blocks.getBlockInstanceFromTypeName(
                presetNode.block.typeName
            )
            presetNode.children.forEach((presetChildNode, cI) => {
                this.children[cI] = new DNANode(presetChildNode)
            })
            this.detach = presetNode.detach
        }
    }
}

export default DNA