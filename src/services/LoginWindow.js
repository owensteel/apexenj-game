/*

    Login Window

*/

const websiteBaseURL = window.location.hostname == "localhost" ? "http://localhost:3000" : "https://apexenj.com"

class LoginWindow {
    constructor(whenCompletedAction = () => { }) {
        // Open window
        window.parent.postMessage("loginRequested", "*");
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