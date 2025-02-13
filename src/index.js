/*

    Index

    Serves as a static initialization point for the game.

*/

import axiosAPI from "./services/api"

import Main from "./v1/game.v1.main";
import MultiplayerClient from "./v1/game.v1.multiplayerClient";
import { uiGenericError, uiLoading, uiPoolNoExistError } from "./v1/game.v1.ui.dialogs";

const UriParam = window.location.pathname.split("/")[1]
const selectedPoolId = UriParam.split("_")[0]
const multiplayerMode = UriParam.split("_")[1] !== "offline"

if (!multiplayerMode || !selectedPoolId) {
    // Private/sandbox Pool
    // Play offline

    if (selectedPoolId) {
        // Fetch saved game state
        const loadingDialog = uiLoading()
        axiosAPI.get(`/games/${selectedPoolId}`).then((response) => {
            if (response.status === 200) {
                new Main(response.data.stateData)
            }
        }).catch(e => {
            if (e.response.status === 404) {
                uiPoolNoExistError()
            } else {
                uiGenericError()
            }
        }).finally(() => {
            loadingDialog.close()
        })
    } else {
        // Create new empty sandbox
        new Main()
    }
} else {
    // Public Pools
    // Syncs or hosts a Pool for shared playing

    new MultiplayerClient(selectedPoolId)
}