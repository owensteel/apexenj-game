/*

    Login Window

*/
class LoginWindow {
    constructor(whenCompletedAction = () => { }) {
        // Open window
        window.parent.postMessage({ messageType: "loginRequested" }, "*");
        // Handle login completion event
        window.addEventListener('message', (event) => {
            if (event.data == "loginCompleted") {
                // Close Window
                loginWindowWrapper.remove()
                // Action
                whenCompletedAction()
            }
        });
    }
}

export default LoginWindow