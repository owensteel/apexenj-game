/*

    Dialogs

*/

class UiDialog {
    constructor(
        msg = null,
        controlType = "ok",
        buttonAction = () => { },
        isRemovable = true
    ) {
        if (!msg) {
            throw new Error("Message must be provided for dialog.")
        }

        // Can the dialog be removed automatically? Or should
        // it have to stay until the user closes it?
        this.isRemovable = isRemovable

        const dialogOverlay = document.createElement("dialog-overlay")
        document.body.appendChild(dialogOverlay)

        // Toggled state
        this.isOpen = true
        this.close = (isUser) => {
            if (this.isRemovable || isUser) {
                this.isOpen = false
                dialogOverlay.remove()
            } else {
                console.warn("Prevented closure of unremovable dialog.")
            }
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
                if (buttonAction) {
                    buttonAction()
                }
                this.close(true)
            })
            dialogContentWrapper.appendChild(dialogButton)
        }
        if (controlType == "spinner") {
            dialogContentWrapper.innerHTML += "<spinner></spinner>"
        }
    }
}

function uiGenericError() {
    return new UiDialog(
        "An error occurred. Please try again later.",
        "none"
    )
}

function uiConnectionError() {
    return new UiDialog(
        "Communications with the multiplayer service were disrupted.<br>Trying to reconnect...",
        "spinner"
    )
}

function uiCouldNotConnect() {
    return new UiDialog(
        "Could not connect to multiplayer service. Please try again later.",
        "none"
    )
}

function uiConnectingToService() {
    return new UiDialog(
        "Connecting to multiplayer service, please wait...",
        "spinner"
    )
}

function uiPoolNoExistError() {
    return new UiDialog(
        "This Pool does not exist.",
        "ok",
        () => {
            // Send player to default sandbox
            window.location.href = "/"
        }
    )
}

function uiGenericServerError() {
    return new UiDialog(
        "A server error occurred.",
        "none"
    )
}

function uiServiceMaxCapacity() {
    return new UiDialog(
        "The multiplayer service is currently at maximum capacity. Please check back later.",
        "none"
    )
}

function uiPoolMaxCapacity() {
    return new UiDialog(
        "This Pool is at maximum capacity. You can only watch.",
        "ok",
        () => {
            new UiDialog(
                "If you wait, you will be connected automatically when a space becomes available.",
                "ok",
                null,
                false
            )
        },
        false
    )
}

function uiLoading() {
    return new UiDialog(
        "Loading, please wait...",
        "spinner"
    )
}

export {
    UiDialog,
    uiConnectionError,
    uiCouldNotConnect,
    uiConnectingToService,
    uiPoolNoExistError,
    uiGenericServerError,
    uiServiceMaxCapacity,
    uiPoolMaxCapacity,
    uiLoading,
    uiGenericError
}