import MusicProviderInterface from './MusicProviderInterface.js';
import 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js';

class YouTubeMusic extends MusicProviderInterface {
    static instance = null;
    static APIKey = "159861648417-pg4ftuci88bo8a9l4he1c6qbqjlk2s1b.apps.googleusercontent.com";
    static scopes = 'https://www.googleapis.com/auth/youtube';
    static prefix = "youTubeMusic";
    static name = "YouTube Music";
    static redirectUri = "http://localhost:52330/index.html";

    playlists = [];

    constructor(accessToken) {
        super();
        if (YouTubeMusic.instance) return YouTubeMusic.instance;
        YouTubeMusic.instance = this;

        if (accessToken) this.setAccessToken(accessToken);
    }

    async initialize() {
        if (!this.getAccessToken()) {
            this.authenticate();
            return;
        }
        this.playlists = await this.fetchPlaylists();
    }

    async authenticate() {
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=token&client_id=${YouTubeMusic.APIKey}&redirect_uri=${encodeURIComponent(YouTubeMusic.redirectUri)}&scope=${encodeURIComponent(YouTubeMusic.scopes)}`;
        window.location.href = authUrl;
    }

    async fetchPlaylists() {
        try {
            const response = await axios.get('https://www.googleapis.com/youtube/v3/playlists', {
                params: {
                    part: 'snippet',
                    mine: true,  // Set to true to retrieve playlists of the authenticated user
                    maxResults: 25  // Adjust as needed
                },
                headers: {
                    'Authorization': `Bearer ${this.getAccessToken()}`
                }
            });

            return response.data.items.map(playlist => ({
                name: playlist.snippet.title,
                id: playlist.id
            }));
        } catch (error) {
            console.error('Error fetching YouTube playlists:', error);
            return [];
        }
    }

    fillPlaylistSelector(selector = '#playlistSelector') {
        const element = document.querySelector(selector);
        element.innerHTML = '';
        this.playlists.forEach(playlist => {
            const option = document.createElement('option');
            option.value = playlist.id;
            option.textContent = playlist.name;
            element.appendChild(option);
        });
    }

    getAccessToken() {
        return localStorage.getItem(YouTubeMusic.prefix+'AccessToken');
    }

    setAccessToken(token) {
        localStorage.setItem(YouTubeMusic.prefix+'AccessToken', token);
    }
}

export default YouTubeMusic;