/*

    Logged-in player model

*/

import Cookies from 'js-cookie';
import axiosAPI from "./api"

class PlayerAccount {
    constructor(id = null, name = null, picture = null) {
        this.id = id
        this.name = name
        this.picture = picture

        this.isLoggedIn = false
    }
    async logInFromCookie() {
        return new Promise((resolveOuter) => {
            const authToken = Cookies.get('auth_token');
            if (authToken) {
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
                    }
                }).catch(e => {
                    if (e.response && (e.response.status == 404 || e.response.status == 401)) {
                        // Cookie is invalid token or points to a
                        // non-existent account, so delete it
                        Cookies.remove('auth_token');
                    }
                }).finally(() => {
                    resolveOuter(this)
                })
            } else {
                resolveOuter(this)
            }
        })
    }
}

export default PlayerAccount