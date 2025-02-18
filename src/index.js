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
import PlayerAccount from './services/playerAccount';

const UriParam = window.location.pathname.split("/")[1]
const selectedPoolId = UriParam.split("_")[0]

// Initialise game

if (!selectedPoolId) {
    // Create new empty sandbox
    const initialisedGame = new Main()
    // Publish menu
    new UiPublishMenu(initialisedGame)
} else {
    // Load existing game
    const loadingDialog = uiLoading()
    // Get the status of player as a logged in user
    const loggedInPlayer = new PlayerAccount()
    await loggedInPlayer.logInFromCookie()
    // Fetch saved game state
    axiosAPI.get(`/games/${selectedPoolId}`).then((response) => {
        if (response.status === 200) {
            const stateDataBuffer = new Uint8Array(response.data.stateData.data)
            if (response.data.status == 0) {
                // Private, offline
                if (loggedInPlayer.isLoggedIn) {
                    // Check if logged-in player is the creator/owner
                    if (loggedInPlayer.id == response.data.creatorId) {
                        // Create offline game
                        const initialisedGame = new Main(
                            msgpack.decode(stateDataBuffer)
                        )
                        // Add Publish Menu
                        new UiPublishMenu(initialisedGame)
                    } else {
                        uiPoolPrivateError()
                    }
                } else {
                    // User may be owner, just not logged in
                    uiMustLogin()
                }
            } else {
                // Public or otherwise online
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