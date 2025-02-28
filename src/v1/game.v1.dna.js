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
        // Non-static values (references only)
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
            if (!childNode) {
                return
            }
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
    // Converts static object to instance
    fromStaticObject(staticDNAObject) {
        return new DNA(
            staticDNAObject.role,
            staticDNAObject.block.typeName,
            staticDNAObject.children,
            staticDNAObject.detach
        )
    }
    addChild(blockTypeName, edge) {
        // Motor blocks cannot have other motor blocks attached

        if (
            (this.block.typeName == Blocks.BLOCK_TYPENAME_MOTOR &&
                blockTypeName == Blocks.BLOCK_TYPENAME_MOTOR) ||
            (this.block.typeName == Blocks.BLOCK_TYPENAME_FOOD &&
                blockTypeName == Blocks.BLOCK_TYPENAME_FOOD) ||
            (this.block.typeName == Blocks.BLOCK_TYPENAME_FOOD &&
                blockTypeName == Blocks.BLOCK_TYPENAME_PLANT)
        ) {
            return false
        }

        // Create node

        const node = new DNA(
            /* role: */ "appendage",
            /* blockTypeName: */ blockTypeName,
            /* children: */[],
            /* detach: */ blockTypeName == Blocks.BLOCK_TYPENAME_DETACHING
        )

        // Add to parent

        if (!isNaN(edge)) {
            const edgeAsIndex = parseInt(edge)
            this.children[edgeAsIndex] = node

            // These values will be added in the building process
            // anyway, but until then
            node.parentNode = this
            node.edgeOfParent = edgeAsIndex
        } else {
            throw new Error("Specified edge of parent was invalid")
        }

        return node
    }
    deleteChild(node) {
        // Nulling method
        this.children[node.edgeOfParent] = null
    }
    getStaticClone() {
        // Clone self without non-static references
        // As these are both useless to store
        // And cause fatal circular references
        return {
            role: this.role,
            block: {
                typeName: this.block.typeName
            },
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