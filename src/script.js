import Spotify from './Spotify.js';
import YouTubeMusic from './YouTubeMusic.js';
import config from './config.js';

document.addEventListener('DOMContentLoaded', init);

async function init() {
    await initSpotify();
    await initYouTubeMusic();
    fillForm();
    updatePlaylistList();
}

async function initYouTubeMusic() {
    const hash = window.location.hash.substr(1);
    const urlParams = new URLSearchParams(hash);
    const accessToken =  urlParams.get('access_token');

    let youTubeMusicAccessToken = getAccessToken('youTubeMusic');

    if (accessToken || youTubeMusicAccessToken) {
        if (!youTubeMusicAccessToken) {
            youTubeMusicAccessToken = accessToken;
            localStorage.setItem('youTubeMusicAccessToken', youTubeMusicAccessToken);
        }
        document.getElementById('connectYouTubeMusicBtn').style.display = 'none';
        const youTubeMusic = new YouTubeMusic(youTubeMusicAccessToken);
        youTubeMusic.initialize();
    } else {
        document.getElementById('connectYouTubeMusicBtn').addEventListener('click', function () {
            const youTubeMusic = new YouTubeMusic();
            youTubeMusic.initialize();
        });
    }

}

async function initSpotify() {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');

    let spotifyAccessToken = getAccessToken('spotify');

    if (authCode || spotifyAccessToken) {
        if (!spotifyAccessToken) {
            spotifyAccessToken = await exchangeAuthCodeForToken(authCode);
            localStorage.setItem('spotifyAccessToken', spotifyAccessToken);
        }
        document.getElementById('connectSpotifyBtn').style.display = 'none';
        const spotify = new Spotify(spotifyAccessToken);
        spotify.initialize();
    } else {
        document.getElementById('connectSpotifyBtn').addEventListener('click', function () {
            const spotify = new Spotify();
            spotify.initialize();
        });
    }
}

async function exchangeAuthCodeForToken(authCode) {
    const codeVerifier = localStorage.getItem('spotifyCodeVerifier');
    const payload = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: Spotify.APIKey,
            grant_type: 'authorization_code',
            code: authCode,
            redirect_uri: Spotify.redirectUri,
            code_verifier: codeVerifier,
        }),
    };

    try {
        const response = await fetch('https://accounts.spotify.com/api/token', payload);
        const data = await response.json();
        if (data.access_token) {
            return data.access_token;
        } else {
            console.error('Failed to retrieve access token:', data);
            return null;
        }
    } catch (error) {
        console.error('Error fetching access token:', error);
        return null;
    }
}

function getAccessToken(prefix) {
    return localStorage.getItem(`${prefix}AccessToken`);
}

function updatePlaylistList() {
    const fromMusicService = document.getElementById('fromMusicService').value;
    const musicProvider = getMusicService(fromMusicService);

    if (!musicProvider.instance) {
        console.error(`Music service instance not found for prefix '${fromMusicService}'`);
        return;
    }

    if (typeof musicProvider.instance.fillPlaylistSelector !== 'function') {
        console.error(`fillPlaylistSelector method not found on the music service instance for prefix '${fromMusicService}'`);
        return;
    }

    musicProvider.instance.fillPlaylistSelector();
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