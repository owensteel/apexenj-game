/*

    Index

    Serves as a static initialization point for the game.

*/

import { io } from "socket.io-client";

import Main from "./v1/game.v1.main";
import { UPDATES_PER_SEC } from "./v1/game.v1.references";

const selectedPoolId = "40940586095569786"
const multiplayerMode = true

if (!multiplayerMode) {
    // Private/sandbox Pool
    // Play offline

    const currentGame = new Main()

    // Rendering loop
    const renderUpdateLoop = () => {
        // Update
        currentGame.currentPool.updateLife()
        setTimeout(() => {
            renderUpdateLoop()
        }, 1000 / UPDATES_PER_SEC)
    }
    renderUpdateLoop()

} else {
    // Public Pools
    // Syncs or hosts a Pool for shared playing

    let currentGame;

    // Connect to the multiplayer sync server
    let serverAddress = "https://multiplayer-server.apexenj.com"
    if (
        window.location.hostname == "localhost" ||
        window.location.hostname == "10.0.0.34"
    ) {
        serverAddress = `http://${window.location.hostname}:3002`
    }
    const socket = io(serverAddress);

    // Error handling
    let isConnectedToServer = false
    let hasDisplayedConnectionError = false

    // Listen for connection events
    socket.on("connect", () => {
        console.log("Connected to server with ID:", socket.id);
        socket.emit("pool_connect", { poolId: selectedPoolId });
        isConnectedToServer = true
        hasDisplayedConnectionError = false
    });

    // Handle connection error
    socket.on('connect_error', (err) => {
        console.error('Connection error:', err);
        if (!hasDisplayedConnectionError) {
            alert("Could not connect to server. Please try again later.")
            hasDisplayedConnectionError = true
        }
    });

    // Listen for server events
    socket.on("pool_client_update", (poolData) => {
        if (!currentGame) {
            currentGame = new Main(
                poolData,
                socket,
                "client"
            )
        }
        currentGame.currentPool.syncWithServer(poolData)
    });
    socket.on("pool_host_init", (poolInitState) => {
        if (poolInitState) {
            console.log("This client is the host")

            if (!currentGame) {
                currentGame = new Main(
                    poolInitState,
                    socket,
                    "host"
                )
            }
            // Sync with server's cached state before
            // serving own state!
            currentGame.currentPool.syncWithServer(poolInitState)

            // Start hosting this game
            const hostUpdateLoop = () => {
                // Only update if server can receive updates
                if (isConnectedToServer) {
                    // Update
                    currentGame.currentPool.updateLife()
                    // Send updated state to server
                    // for syncing
                    socket.emit(
                        "pool_host_sync",
                        currentGame.currentPool.exportToObj()
                    );
                }
                setTimeout(() => {
                    hostUpdateLoop()
                }, 1000 / UPDATES_PER_SEC)
            }
            hostUpdateLoop()

            // Receive any data from other players
            socket.on("pool_host_update", (data) => {
                // Import new organism
                if (data.updateType == "new_organism") {
                    console.log("Adding new organism...")
                    currentGame.currentPool.importOrganism(
                        data.newOrganismData
                    )
                }
            })
        }
    })

    // Handle disconnection
    socket.on("disconnect", () => {
        isConnectedToServer = false
        console.log("Disconnected from server");
    });

}