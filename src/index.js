/*

    Index

    Serves as a static initialization point for the game.

*/

import Main from "./v1/game.v1.main";
import MultiplayerClient from "./v1/game.v1.multiplayerClient";

import DemoPool from "./v1/test_objects/pool_1.json"

const UriParams = window.location.pathname.split("/")
const selectedPoolId = UriParams[1]
const multiplayerMode = UriParams[2] !== "offline"

if (!multiplayerMode || !selectedPoolId) {
    // Private/sandbox Pool
    // Play offline

    new Main(DemoPool)
} else {
    // Public Pools
    // Syncs or hosts a Pool for shared playing

    new MultiplayerClient(selectedPoolId)
}