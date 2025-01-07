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
            role: "disconnector",
            offshoots: [
                {
                    role: "appendage",
                    offshoots: []
                }
            ]
        }
    ]
}

export { demoDnaSequence }