/*

    Login Window

*/

const websiteBaseURL = window.location.hostname == "localhost" ? "http://localhost:3000" : "https://apexenj.com"

class LoginWindow {
    constructor(whenCompletedAction = () => { }) {
        // Open frame
        const loginWindowWrapper = document.createElement("login-window-wrapper")
        const loginWindowFrame = document.createElement("iframe")
        loginWindowFrame.className = "login-window-frame"
        loginWindowFrame.src = `${websiteBaseURL}/account/signin/?origin=play.apexenj.com&ref=game_client`
        loginWindowWrapper.appendChild(loginWindowFrame)
        document.body.appendChild(loginWindowWrapper)

        // Handle login completion event
        window.addEventListener('message', (event) => {
            if (event.origin == websiteBaseURL && event.data == "loginCompleted") {
                // Close Window
                loginWindowWrapper.remove()
                // Action
                whenCompletedAction()
            }
        });
    }
}

export default LoginWindow