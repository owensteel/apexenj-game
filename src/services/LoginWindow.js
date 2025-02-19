/*

    Login Window

*/

import Cookies from 'js-cookie';

class LoginWindow {
    constructor(whenCompletedAction = () => { }) {
        const loginWindowWrapper = document.createElement("login-window-wrapper")

        const loginWindowFrame = document.createElement("iframe")
        loginWindowFrame.className = "login-window-frame"
        loginWindowFrame.src = "https://apexenj.com/account/signin/?origin=play.apexenj.com&ref=game_client"
        loginWindowWrapper.appendChild(loginWindowFrame)

        document.body.appendChild(loginWindowWrapper)

        // TODO: replace with extra-iframe function
        const hasLoginCompletedCheck = setInterval(() => {
            if (Cookies.get('auth_token')) {
                // Has completed
                clearInterval(hasLoginCompletedCheck)
                // Close Window
                loginWindowWrapper.remove()
                // Action
                whenCompletedAction()
            }
        }, 2000)
    }
}

export default LoginWindow