/*

    DNA

*/

const demoDnaSequence = {
    role: "root",
    offshoots: [
        {
            role: "appendage",
            offshoots: [
                {
                    role: "color",
                    value: "red",
                    offshoots: []
                }
            ]
        },
        {
            role: "appendage",
            offshoots: [
                {
                    role: "color",
                    value: "yellow",
                    offshoots: []
                },
                {
                    role: "appendage",
                    offshoots: [
                        {
                            role: "color",
                            value: "purple",
                            offshoots: []
                        }
                    ]
                }
            ]
        },
        {
            role: "color",
            value: "green",
            offshoots: []
        },
        {
            role: "appendage",
            offshoots: [
                {
                    role: "appendage",
                    offshoots: []
                }
            ]
        }
    ]
}

function createNode(parentNode = null) {
    const node = {
        role: null,
        offshoots: []
    }

    node.role = prompt("Node role?")

    if (node.role == "color") {
        if (parentNode && parentNode.offshoots.some(obj => obj.role === "color")) {
            // Cannot be defined twice
            alert("This node already has a color defined.")
            return createNode(parentNode)
        }
        node.value = prompt("Node value?")
    }

    if (node.role == null) {
        // Invalid input
        return false
    }

    parentNode.offshoots.push(node)

    return node
}

export { createNode, demoDnaSequence }