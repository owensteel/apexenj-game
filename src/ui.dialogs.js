/*

    Dialogs

*/

function createUiDialog(msg, type = "message") {
    const dialogOverlay = document.createElement("dialog-overlay")
    document.body.appendChild(dialogOverlay)

    const close = () => {
        dialogOverlay.remove()
    }

    const dialogBox = document.createElement("dialog")
    dialogOverlay.appendChild(dialogBox)

    const dialogContentWrapper = document.createElement("dialog-content-wrapper")
    dialogContentWrapper.innerHTML = `<p>${msg}</p>`
    dialogBox.appendChild(dialogContentWrapper)

    if (type == "message") {
        const dialogButton = document.createElement("button")
        dialogButton.innerHTML = "OK"
        dialogButton.addEventListener("click", close)
        dialogContentWrapper.appendChild(dialogButton)
    }
    if (type == "spinner") {
        dialogContentWrapper.innerHTML += "<spinner></spinner>"
    }

    return { close }
}

function uiConnectionError() {
    return createUiDialog(
        "Communications with the multiplayer service were disrupted.",
        "none"
    )
}

function uiCouldNotConnect() {
    return createUiDialog(
        "Could not connect to multiplayer service. Please try again later.",
        "none"
    )
}

function uiConnectingToService() {
    return createUiDialog(
        "Connecting to multiplayer service, please wait...",
        "spinner"
    )
}

export {
    createUiDialog,
    uiConnectionError,
    uiCouldNotConnect,
    uiConnectingToService
}