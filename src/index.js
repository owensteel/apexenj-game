/*

    Index

    Serves as a static initialization point for the game.

*/

import msgpack from "msgpack-lite"

import axiosAPI from "./services/api"
import Main from "./v1/game.v1.main";
import MultiplayerClient from "./v1/game.v1.multiplayerClient";
import { uiGenericError, uiLoading, uiMustLogin, uiPoolNoExistError, uiPoolPrivateError } from "./v1/game.v1.ui.dialogs";
import UiPublishMenu from "./v1/game.v1.ui.publish";
import PlayerAccount from './services/PlayerAccount';

// Prevent direct access to Game if intended to only be
// embedded in a iframe
if (window.location.hostname !== "localhost" && (window.self === window.top)) {
    // The page is not inside an iframe
    document.body.innerHTML = ""
    throw new Error("Illegal access method of Game client")
}

// Get the status of player as a logged in user

const loggedInPlayer = new PlayerAccount()
await loggedInPlayer.logInFromCookie()

// Initialise game

const UriParams = window.location.pathname.split("/")
// Remove empty first parameter
if (!UriParams[0]) {
    UriParams.splice(0, 1)
}
// Remove redundant path parameter
if (UriParams[0] == "play") {
    UriParams.splice(0, 1)
}
const selectedPoolId = UriParams[0]

if (!selectedPoolId) {
    // Create new empty sandbox
    if (loggedInPlayer.isLoggedIn) {
        const initialisedGame = new Main(null, null, loggedInPlayer)
        // Publish menu
        new UiPublishMenu(initialisedGame)
    } else {
        // User must be logged-in to create a Sandbox
        uiMustLogin(() => {
            window.location.reload()
        })
    }
} else {
    const loadingDialog = uiLoading()
    // Load existing game
    axiosAPI.get(`/games/${selectedPoolId}`).then((response) => {
        if (response.status === 200) {
            const stateDataBuffer = new Uint8Array(response.data.stateData.data)
            if (response.data.status == 0) {
                // Private, offline
                if (loggedInPlayer.isLoggedIn) {
                    // Check if logged-in player is the creator/owner
                    if (loggedInPlayer.id == response.data.creatorId) {
                        // Open offline game
                        const initialisedGame = new Main(
                            msgpack.decode(stateDataBuffer),
                            null,
                            loggedInPlayer
                        )
                        // Add Publish Menu
                        new UiPublishMenu(initialisedGame)
                    } else {
                        uiPoolPrivateError()
                    }
                } else {
                    // User may be owner, just not logged in
                    uiMustLogin(() => {
                        window.location.reload()
                    })
                }
            } else {
                // Public or otherwise online, allow anyone
                new MultiplayerClient(
                    selectedPoolId,
                    loggedInPlayer
                )
            }
        } else {
            throw new Error("Unhandled non-error status from API")
        }
    }).catch(e => {
        console.error("Error fetching Game from API", e)
        if (e.response) {
            if (e.response.status === 404) {
                uiPoolNoExistError()
            } else {
                uiGenericError()
            }
        }
    }).finally(() => {
        loadingDialog.close()
    })
}