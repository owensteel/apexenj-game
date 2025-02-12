/*

    Multiplayer Client

*/

import { io } from "socket.io-client";

import * as uiDialogs from "./game.v1.ui.dialogs"
import Main from "./game.v1.main";
import { UPDATES_PER_SEC } from "./game.v1.references";

class MultiplayerClient {
    constructor(selectedPoolId) {
        // Setup
        if (!selectedPoolId) {
            throw new Error("Pool to connect to must be specified")
        }
        this.selectedPoolId = selectedPoolId
        this.currentGame = null
        this.role = "client" // Client or host

        // Connect to the service
        const serverAddress = (
            window.location.hostname == "localhost" ||
            window.location.hostname == "10.0.0.34"
        ) ? `http://${window.location.hostname}:3002` : "https://multiplayer-service.apexenj.com"
        const socket = io(serverAddress);
        this.connectionSocket = socket

        // Dialog handling
        this.currentOpenDialog = uiDialogs.uiConnectingToService()

        // Error handling
        this.isConnectedToServer = false
        this.hasReceivedFirstUpdate = false

        // Listen for connection events
        socket.on("connect", () => {
            console.log("Connected to server with ID:", socket.id);
            socket.emit("pool_connect", { poolId: this.selectedPoolId });
            this.isConnectedToServer = true

            // Don't remove "connecting" dialog until first
            // update has actually been received
            if (this.hasReceivedFirstUpdate) {
                // Remove any connection error dialogs
                // as we've now connected
                this.currentOpenDialog.close()
            }
        });

        // Handle connection error
        socket.on('connect_error', (err) => {
            console.error('Connection error:', err);
            // Connection error dialog
            if (!this.currentOpenDialog.getOpenState()) {
                this.currentOpenDialog = uiDialogs.uiCouldNotConnect()
            }
        });

        // Listen for server events
        let timeOfLastClientUpdate = null
        let clientUpdateDelayCheck = null
        socket.on("pool_client_update", (poolData) => {
            // Sync Pool with server state
            this.syncGameWithServer(poolData)
            // Check for delays
            timeOfLastClientUpdate = Date.now()
            clientUpdateDelayCheck = setTimeout(() => {
                if (Date.now() >= timeOfLastClientUpdate + 1000) {
                    // No updates for a second, so freeze
                    this.hasReceivedFirstUpdate = false
                    // "Reconnecting" dialog
                    if (!this.currentOpenDialog.getOpenState()) {
                        this.currentOpenDialog = uiDialogs.uiConnectionError()
                    }
                }
            }, 1000)
        });
        socket.on("pool_host_init", (poolInitState) => {
            if (!poolInitState) {
                return
            }
            console.log("This client is the host")

            // Update role
            this.role = "host"

            // We are no longer a client
            if (clientUpdateDelayCheck) {
                clearTimeout(clientUpdateDelayCheck)
            }

            // Sync with server's cached state before
            // serving own state!
            this.syncGameWithServer(poolInitState)

            // Start hosting this game
            let exportedOrganisms = []
            const hostUpdateLoop = () => {
                // Only update if server can receive updates
                if (this.isConnectedToServer) {
                    // Update
                    this.currentGame.currentPool.updateLife()
                    // Send updated state to server
                    // for syncing

                    // Clone so we can remove data without damaging
                    // the original static cache
                    const dataToSend = JSON.parse(JSON.stringify(
                        this.currentGame.currentPool.getStaticExport()
                    ))

                    // Don't send DNA twice, after initial update
                    // server has it cached already
                    for (const organism of dataToSend.organisms) {
                        if (exportedOrganisms.includes(organism.id)) {
                            delete organism["dna"]
                        } else {
                            // Send DNA this time, make sure it isn't
                            // sent again
                            exportedOrganisms.push(organism.id)
                        }
                    }

                    // Send to server
                    socket.emit(
                        "pool_host_sync",
                        dataToSend
                    );

                    // Only ensure next update if connected already
                    setTimeout(() => {
                        hostUpdateLoop()
                    }, 1000 / UPDATES_PER_SEC)
                }
            }
            hostUpdateLoop()

            // Receive any data from other players
            socket.on("pool_host_update", (data) => {
                // Import new organism
                if (data.updateType == "new_organism") {
                    console.log("Adding new organism...")
                    this.currentGame.currentPool.importOrganism(
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
        socket.on("server_error", (errorMsg) => {
            console.log("Server error", errorMsg)

            if (this.currentOpenDialog) {
                this.currentOpenDialog.close()
            }

            switch (errorMsg) {
                case "pool_noexist":
                    this.currentOpenDialog = uiDialogs.uiPoolNoExistError()
                    break;
                default:
                    this.currentOpenDialog = uiDialogs.uiGenericServerError()
            }
        })

        // Handle disconnection
        socket.on("disconnect", () => {
            this.isConnectedToServer = false
            console.log("Disconnected from server");

            // Connection error dialog
            if (!this.currentOpenDialog.getOpenState()) {
                this.currentOpenDialog = uiDialogs.uiConnectionError()
            }
        });
    }
    syncGameWithServer(stateData) {
        // Update or initialise game
        if (!this.currentGame) {
            this.currentGame = new Main(
                stateData,
                this
            )
        }
        this.currentGame.currentPool.syncWithServer(stateData)

        // Only remove "connecting" dialog now we've
        // had first update
        if (!this.hasReceivedFirstUpdate || this.currentOpenDialog.getOpenState()) {
            this.hasReceivedFirstUpdate = true
            this.currentOpenDialog.close()
        }
    }
}

export default MultiplayerClient