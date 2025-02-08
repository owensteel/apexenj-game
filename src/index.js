/*

    Index

    Serves as a static initialization point for the game.

*/

import Main from "./v1/game.v1.main";
import MultiplayerClient from "./v1/game.v1.multiplayerClient";

const UriParams = window.location.pathname.split("/")
const selectedPoolId = UriParams[1]
const multiplayerMode = UriParams[2] !== "offline"

if (!multiplayerMode || !selectedPoolId) {
    // Private/sandbox Pool
    // Play offline

    new Main()
} else {
    // Public Pools
    // Syncs or hosts a Pool for shared playing

    new MultiplayerClient(selectedPoolId)
}