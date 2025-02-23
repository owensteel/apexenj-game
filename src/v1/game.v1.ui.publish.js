/*

    Save/publish menu

*/

import Main from "./game.v1.main"

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


        saveButton.addEventListener("click", async () => {
            currentGame.currentPool.saveStateToServer()
            // Update frontend URL
            window.parent.postMessage(
                {
                    messageType: "gameCreated",
                    gameId: currentGame.currentPool.id
                }, "*"
            );
        })
    }
}

export default UiPublishMenu