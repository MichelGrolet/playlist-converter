import MusicProviderInterface from './MusicProviderInterface.js';
import 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js';

class Spotify extends MusicProviderInterface {
    static instance = null;
    static APIKey = "c46b5e32ccfa4cd583b351c58cb9f99d";
    static scopes = 'user-read-private user-read-email';
    static prefix = "spotify";
    static name = "Spotify";
    static redirectUri = "http://localhost:52330/index.html";

    playlists = [];

    constructor(accessToken) {
        super();
        if (Spotify.instance) return Spotify.instance;
        Spotify.instance = this;

        if (accessToken) this.setAccessToken(accessToken);
        else this.authenticate();
        this.initialize();
    }

    async initialize() {
        this.playlists = await this.fetchPlaylists();
        this.fillPlaylistSelector();
    }

    async authenticate() {
    
        const url = `https://accounts.spotify.com/authorize?response_type=token&client_id=${Spotify.APIKey}&scope=${encodeURIComponent(Spotify.scopes)}&redirect_uri=${encodeURIComponent(Spotify.redirectUri)}`;
    
        window.location.href = url;
    }

    async fetchPlaylists() {
        try {
            const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
                headers: {
                    'Authorization': `Bearer ${this.getAccessToken}`
                }
            });
    
            return response.data.items.map(playlist => ({
                name: playlist.name,
                url: playlist.external_urls.spotify
            }));
        } catch (error) {
            console.error('Error fetching Spotify playlists:', error);
            return [];
        }
    }

    fillPlaylistSelector(selector = '#playlistSelector') {
        const element = document.querySelector(selector);
        this.playlists.forEach(playlist => {
            const option = document.createElement('option');
            option.value = playlist.url;
            option.textContent = playlist.name;
            element.appendChild(option);
        });
    }

    getAccessToken() {
        return localStorage.getItem(Spotify.prefix+'AccessToken');
    }

    setAccessToken(token) {
        localStorage.setItem(Spotify.prefix+'AccessToken', token);
    }
}

export default Spotify;