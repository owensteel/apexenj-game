/*

    Save/publish menu

*/

import msgpack from "msgpack-lite"
import Cookies from 'js-cookie';

import axiosInstance from '../services/api';

import Main from "./game.v1.main"
import { uiGameSaved, uiGenericError, uiLoading, uiMustLogin } from "./game.v1.ui.dialogs"

class UiPublishMenu {
    constructor(currentGame) {
        if (currentGame instanceof Main == false) {
            throw new Error("Publish Menu must have instance of initialised Game")
        }
        this.currentGame = currentGame

        const saveButton = document.createElement("button")
        saveButton.className = "publish-button"
        saveButton.innerHTML = "Save"
        currentGame.gameWrapper.appendChild(saveButton)

        const authToken = Cookies.get('auth_token');
        saveButton.addEventListener("click", async () => {
            if (!authToken) {
                uiMustLogin()
                return
            }
            const loadingUi = uiLoading()
            try {
                const gameStateData = currentGame.currentPool.getStaticExport()
                axiosInstance.post('/games/save', {
                    stateDataBuffer: msgpack.encode(gameStateData)
                }, {
                    headers: {
                        Authorization: `Bearer ${authToken}`
                    }
                }).then((response) => {
                    if (response.status === 201) {
                        uiGameSaved()
                        // Update URL so that user re-enters this saved game
                        // on refresh instead of going back to empty Sandbox
                        window.history.pushState(
                            {
                                "html": document.body.innerHTML,
                                "pageTitle": document.title
                            },
                            "",
                            `/${gameStateData.id}_offline`
                        );
                    }
                }).catch(e => {
                    console.error("Error occurred during saving", e)
                    uiGenericError()
                }).finally(() => {
                    loadingUi.close()
                });
            } catch (error) {
                console.error('Error creating goal:', error);
            }
        })
    }
}

export default UiPublishMenu