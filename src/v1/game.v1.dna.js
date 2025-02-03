/*

    DNA

*/

import * as Blocks from './game.v1.blocks'
import { DNA_NODE_ROLE_APPENDAGE } from './game.v1.references'

class DNA {
    constructor(
        // Default values
        role = DNA_NODE_ROLE_APPENDAGE,
        blockTypeName = Blocks.BLOCK_TYPENAME_DEFAULT,
        children = [],
        detach = false
    ) {
        this.role = role

        // Make sure all blocks are in sync with the
        // current instances — only reference the block
        // specified type name
        this.block = Blocks.getBlockInstanceFromTypeName(
            blockTypeName
        )

        // Convert any object children into DNA instances
        this.children = new Array(6)
        children.forEach((childNode, cI) => {
            this.children[cI] = new DNA(
                childNode.role,
                childNode.block.typeName,
                childNode.children,
                childNode.detach
            )
        })
        this.detach = detach
    }
    exportToJson() {
        return JSON.stringify(this)
    }
}

export default DNA