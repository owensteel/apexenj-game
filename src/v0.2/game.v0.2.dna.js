/*

    DNA

*/

import * as Blocks from './game.v0.2.blocks'

const demoDnaSequence = {
    role: "root",
    block: new Blocks.HeartBlock(),
    offshoots: [
        {
            role: "appendage",
            block: new Blocks.DefaultBlock(),
            offshoots: [
                {
                    role: "appendage",
                    block: new Blocks.DefaultBlock(),
                    offshoots: []
                },
                {
                    role: "appendage",
                    block: new Blocks.DefaultBlock(),
                    offshoots: []
                },
                {
                    role: "appendage",
                    block: new Blocks.DefaultBlock(),
                    offshoots: []
                }
            ]
        }
    ]
}

function createNode(parentNode = null) {
    if (parentNode.role == "root" && parentNode.offshoots.length > 0) {
        return false
    }

    const node = {
        role: "appendage",
        block: new Blocks.DefaultBlock(),
        offshoots: []
    }

    if (parentNode) {
        parentNode.offshoots.push(node)
    }

    return node
}

export { createNode, demoDnaSequence }