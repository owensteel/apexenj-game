/*

    Dialogs

*/

function createUiDialog(msg, controlType = "ok", buttonAction = () => { }) {
    const dialogOverlay = document.createElement("dialog-overlay")
    document.body.appendChild(dialogOverlay)

    let isOpen = true
    const getOpenState = () => {
        return isOpen
    }
    const close = () => {
        isOpen = false
        dialogOverlay.remove()
    }

    const dialogBox = document.createElement("dialog")
    dialogOverlay.appendChild(dialogBox)

    const dialogContentWrapper = document.createElement("dialog-content-wrapper")
    dialogContentWrapper.innerHTML = `<p>${msg}</p>`
    dialogBox.appendChild(dialogContentWrapper)

    if (controlType == "ok") {
        const dialogButton = document.createElement("button")
        dialogButton.innerHTML = "OK"
        dialogButton.addEventListener("click", () => {
            buttonAction()
            close()
        })
        dialogContentWrapper.appendChild(dialogButton)
    }
    if (controlType == "spinner") {
        dialogContentWrapper.innerHTML += "<spinner></spinner>"
    }

    return { getOpenState, close }
}

function uiConnectionError() {
    return createUiDialog(
        "Communications with the multiplayer service were disrupted.<br>Trying to reconnect...",
        "spinner"
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

function uiPoolNoExistError() {
    return createUiDialog(
        "Could not connect to this Pool. It does not exist.",
        "ok",
        () => {
            // Send player to default sandbox
            window.location.href = "/"
        }
    )
}

function uiGenericServerError() {
    return createUiDialog(
        "A server error occurred.",
        "none"
    )
}

export {
    createUiDialog,
    uiConnectionError,
    uiCouldNotConnect,
    uiConnectingToService,
    uiPoolNoExistError,
    uiGenericServerError
}