/*

    Index

    Serves as a static initialization point for the game.

*/

import msgpack from "msgpack-lite"

import axiosAPI from "./services/api"
import Main from "./v1/game.v1.main";
import MultiplayerClient from "./v1/game.v1.multiplayerClient";
import { uiGenericError, uiLoading, uiPoolNoExistError } from "./v1/game.v1.ui.dialogs";
import UiPublishMenu from "./v1/game.v1.ui.publish";

const UriParam = window.location.pathname.split("/")[1]
const selectedPoolId = UriParam.split("_")[0]
const multiplayerMode = UriParam.split("_")[1] !== "offline"

// Initialise game

if (!multiplayerMode || !selectedPoolId) {
    // Private/sandbox Pool
    // Play offline

    let initialisedGame = null

    if (selectedPoolId) {
        // Fetch saved game state
        const loadingDialog = uiLoading()
        axiosAPI.get(`/games/${selectedPoolId}`).then((response) => {
            if (response.status === 200) {
                const stateDataBuffer = new Uint8Array(response.data.stateData.data)
                initialisedGame = new Main(msgpack.decode(stateDataBuffer))
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
            if (initialisedGame) {
                // Publish menu
                new UiPublishMenu(initialisedGame)
            }
        })
    } else {
        // Create new empty sandbox
        initialisedGame = new Main()
        // Publish menu
        new UiPublishMenu(initialisedGame)
    }
} else {
    // Public Pools
    // Syncs or hosts a Pool for shared playing

    new MultiplayerClient(selectedPoolId)
}