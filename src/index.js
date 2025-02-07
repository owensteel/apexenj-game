/*

    Index

    Serves as a static initialization point for the game.

*/

import { io } from "socket.io-client";

import * as uiDialogs from "./ui.dialogs"

import Main from "./v1/game.v1.main";
import { UPDATES_PER_SEC } from "./v1/game.v1.references";

const UriParams = window.location.pathname.split("/")
const selectedPoolId = UriParams[1]
const multiplayerMode = UriParams[2] == "offline"

if (!multiplayerMode || !selectedPoolId) {
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
    let serverAddress = "https://multiplayer-service.apexenj.com"
    if (
        window.location.hostname == "localhost" ||
        window.location.hostname == "10.0.0.34"
    ) {
        serverAddress = `http://${window.location.hostname}:3002`
    }
    const socket = io(serverAddress);

    // Dialog handling
    let currentOpenDialog = uiDialogs.uiConnectingToService()

    // Error handling
    let isConnectedToServer = false
    let hasReceivedFirstUpdate = false

    // Listen for connection events
    socket.on("connect", () => {
        console.log("Connected to server with ID:", socket.id);
        socket.emit("pool_connect", { poolId: selectedPoolId });
        isConnectedToServer = true

        // Don't remove "connecting" dialog until first
        // update has actually been received
        if (hasReceivedFirstUpdate) {
            // Remove any connection error dialogs
            // as we've now connected
            currentOpenDialog.close()
        }
    });

    // Handle connection error
    socket.on('connect_error', (err) => {
        console.error('Connection error:', err);
        // Connection error dialog
        if (!currentOpenDialog.getOpenState()) {
            currentOpenDialog = uiDialogs.uiCouldNotConnect()
        }
    });

    // Syncing
    function syncGameWithServer(stateData, multiplayerRole) {
        // Update or initialise game
        if (!currentGame) {
            currentGame = new Main(
                stateData,
                socket,
                multiplayerRole
            )
        }
        currentGame.currentPool.syncWithServer(stateData)

        // Only remove "connecting" dialog now we've
        // had first update
        if (!hasReceivedFirstUpdate || currentOpenDialog.getOpenState()) {
            hasReceivedFirstUpdate = true
            currentOpenDialog.close()
        }
    }

    // Listen for server events
    let timeOfLastClientUpdate = null
    let clientUpdateDelayCheck = null
    socket.on("pool_client_update", (poolData) => {
        // Sync Pool with server state
        syncGameWithServer(poolData, "client")
        // Check for delays
        timeOfLastClientUpdate = Date.now()
        clientUpdateDelayCheck = setTimeout(() => {
            if (Date.now() >= timeOfLastClientUpdate + 1000) {
                // No updates for a second, so freeze
                hasReceivedFirstUpdate = false
                // "Reconnecting" dialog
                if (!currentOpenDialog.getOpenState()) {
                    currentOpenDialog = uiDialogs.uiConnectionError()
                }
            }
        }, 1000)
    });
    socket.on("pool_host_init", (poolInitState) => {
        if (!poolInitState) {
            return
        }
        console.log("This client is the host")

        // We are no longer a client
        if (clientUpdateDelayCheck) {
            clearTimeout(clientUpdateDelayCheck)
        }

        // Sync with server's cached state before
        // serving own state!
        syncGameWithServer(poolInitState, "host")

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
    })
    socket.on("pool_host_reset_to_client", () => {
        console.log("This client is no longer the host")
        // Reload application
        // As user has already "disconnected" anyway
        // This is an edge case for JS timeouts or frozen tabs
        window.location.reload()
    })

    // Handle disconnection
    socket.on("disconnect", () => {
        isConnectedToServer = false
        console.log("Disconnected from server");

        // Connection error dialog
        if (!currentOpenDialog.getOpenState()) {
            currentOpenDialog = uiDialogs.uiConnectionError()
        }
    });

}