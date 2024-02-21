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
    const hash = window.location.hash.substring(1);
    const urlParams = new URLSearchParams(hash);
    const accessToken =  urlParams.get('access_token');

    let youTubeMusicAccessToken = getAccessToken('youTubeMusic');

    if (accessToken || youTubeMusicAccessToken) {
        if (!youTubeMusicAccessToken) {
            youTubeMusicAccessToken = accessToken;
            localStorage.setItem('youTubeMusicAccessToken', youTubeMusicAccessToken);
        }
        document.getElementById('connectYouTubeMusicCheckbox').style.display = 'none';
        const youTubeMusic = new YouTubeMusic(youTubeMusicAccessToken);
        youTubeMusic.initialize();
    } else {
        document.getElementById('connectYouTubeMusicCheckbox').addEventListener('change', function (e) {
            const youtube = new YouTubeMusic();
            if (e.target.checked) {
                youtube.initialize();
            } else {
                const youtube = new YouTubeMusic();
                youtube.cleanLocalStorage();
            }
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
        document.getElementById('connectSpotifyCheckbox').checked = true;
        const spotify = new Spotify(spotifyAccessToken);
        spotify.initialize();
    } else {
        document.getElementById('connectSpotifyCheckbox').addEventListener('change', function (e) {
            const spotify = new Spotify();
            if (e.target.checked) {
                spotify.initialize();
            } else {
                spotify.cleanLocalStorage();
            }
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
    if (!fromMusicService) return;

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

async function convertPlaylist() {
    const from = getMusicService(document.getElementById('fromMusicService'));
    const to = getMusicService(document.getElementById('toMusicService'));

    const playlistId = document.getElementById('playlistSelector').value;
    const playlistData = await from.instance.fetchPlaylistData(playlistId);
    
    to.createPlaylist(playlistData);
}

function fillForm() {
    // Get the select elements by their IDs
    const fromMusicServiceSelect = document.getElementById('fromMusicService');
    const toMusicServiceSelect = document.getElementById('toMusicService');
    const convertBtn = document.getElementById('convertBtn');

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
    convertBtn.addEventListener('click', convertPlaylist);
}