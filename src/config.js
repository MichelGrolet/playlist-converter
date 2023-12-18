import Spotify from "./Spotify.js";
import YouTubeMusic from "./YouTubeMusic.js";

const config = {
    musicServices: new Map([
        ['spotify', () => new Spotify()],
        ['youTubeMusic', () => new YouTubeMusic()]
    ])
};

export default config;
