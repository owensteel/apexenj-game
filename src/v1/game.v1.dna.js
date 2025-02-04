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
        detach = false,
        parentNode = null,
        edgeOfParent = null
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

        // Hierarchal references (non-static)
        this.parentNode = parentNode
        this.edgeOfParent = edgeOfParent
    }
    getStaticClone() {
        // Clone self without non-static references
        // As these are both useless to store
        // And cause fatal circular references
        return {
            role: this.role,
            blockTypeName: this.block.typeName,
            children: this.children.map((child) => {
                if (!child) {
                    return null
                }
                // Make sure all children are also
                // static clones
                return child.getStaticClone()
            }),
            detach: this.detach
        }
    }
    exportToJson() {
        // Export static clone
        return JSON.stringify(this.getStaticClone())
    }
}

export default DNA