import Spotify from "./Spotify.js";
import YouTubeMusic from "./YouTubeMusic.js";

const config = {
    musicServices: new Map([
        ['spotify', Spotify],
        ['youTubeMusic', YouTubeMusic]
    ])
};

export default config;
