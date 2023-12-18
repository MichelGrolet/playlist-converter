import Spotify from './Spotify.js';
import YouTubeMusic from './YouTubeMusic.js';
import config from './config.js';

document.addEventListener('DOMContentLoaded', init);

async function init() {
    const spotifyAccessToken = getAccessToken('spotify');
    console.log("spotifyAccessToken" + spotifyAccessToken + " " + getAccessToken('spotify'));
    if (spotifyAccessToken) {
        document.getElementById('connectSpotifyBtn').style.display = 'none';
        new Spotify(spotifyAccessToken);
    } else {
        document.getElementById('connectSpotifyBtn').addEventListener('click', function() {
            new Spotify();
        });
    }

    const youTubeMusicAccessToken = getAccessToken('youTubeMusic');
    console.log("youTubeMusicAccessToken" + youTubeMusicAccessToken + " " + getAccessToken('youTubeMusic'));
    if (youTubeMusicAccessToken) {
        document.getElementById('connectYouTubeMusicBtn').style.display = 'none';
        //new YouTubeMusic(youTubeMusicAccessToken);
    } else {
        document.getElementById('connectYouTubeMusicBtn').addEventListener('click', function() {
          //  new YouTubeMusic();
        });
    }

    fillForm();
    updatePlaylistList();
}

function getAccessToken(prefix) {
    return localStorage.getItem(`${prefix}AccessToken`);
}

function updatePlaylistList() {
    const fromMusicService = document.getElementById('fromMusicService').value;
    if (fromMusicService == "" || !getMusicService(fromMusicService)) throw new Error(`Music service not found for prefix '${fromMusicService}'`);
    const musicProvider = getMusicService(fromMusicService);
    musicProvider.fillPlaylistSelector();
}

function getMusicService(prefix) {
    return config.musicServices.get(prefix);
}

function fillForm() {
    // Get the select elements by their IDs
    const fromMusicServiceSelect = document.getElementById('fromMusicService');
    const toMusicServiceSelect = document.getElementById('toMusicService');

    // Function to populate select options
    function populateSelectOptions(selectElement, selectedOption = YouTubeMusic) {
        for (let [_, musicService] of config.musicServices) {
            const opt = document.createElement('option');
            opt.value = musicService.prefix;
            opt.textContent = musicService.name;
            if (musicService.prefix === selectedOption.prefix) opt.selected = true;
            selectElement.appendChild(opt);
        }
    }

    // Populate the select elements with the music services
    populateSelectOptions(fromMusicServiceSelect, Spotify);
    populateSelectOptions(toMusicServiceSelect);

    // Change the playlists when the music service changes
    fromMusicServiceSelect.addEventListener('change', updatePlaylistList);
}