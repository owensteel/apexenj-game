/*

    Logged-in player model

*/

import Cookies from 'js-cookie';
import axiosAPI from "./api"
import { uiGenericServerError, uiLoading } from '../v1/game.v1.ui.dialogs';

class PlayerAccount {
    constructor(id = null, name = "Anonymous", picture = null) {
        this.id = id
        this.name = name
        this.picture = picture

        this.isLoggedIn = false
    }
    async logInFromCookie() {
        return new Promise((resolveOuter) => {
            const authToken = Cookies.get('auth_token');
            if (authToken) {
                const loadingDialog = uiLoading()
                axiosAPI.get('/auth/account', {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }).then((response) => {
                    if (response.status == 200) {
                        const { id, name, picture } = response.data;
                        this.id = id
                        this.name = name
                        this.picture = picture
                        this.isLoggedIn = true

                        // Resolve as we have a certain response
                        resolveOuter(this)
                    } else {
                        throw new Error("Unhandled non-error response status from API")
                    }
                }).catch(e => {
                    if (e.response && (e.response.status == 404 || e.response.status == 401)) {
                        // Cookie is invalid token or points to a
                        // non-existent account, so delete it
                        Cookies.remove('auth_token');
                        // Resolve as this is certainly a case of the user "not being
                        // logged-in"
                        resolveOuter(this)
                    } else {
                        // Do not resolve because this is an exception server-side, not
                        // necessarily a response
                        uiGenericServerError(false)
                    }
                }).finally(() => {
                    loadingDialog.close()
                })
            } else {
                // Resolve as we are sure the user is not logged-in
                resolveOuter(this)
            }
        })
    }
}

export default PlayerAccount