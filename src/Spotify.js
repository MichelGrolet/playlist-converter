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
    }

    async initialize() {
        if (!this.getAccessToken()) {
            this.authenticate();
            return;
        }
        this.playlists = await this.fetchPlaylists();
    }

    generateRandomString(length) {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        let array = new Uint8Array(length);
        window.crypto.getRandomValues(array);
        array = array.map(x => possible.charCodeAt(x % possible.length));
        return String.fromCharCode.apply(null, array);
    }

    async generateCodeChallenge(codeVerifier) {
        const encoder = new TextEncoder();
        const data = encoder.encode(codeVerifier);
        const digest = await window.crypto.subtle.digest('SHA-256', data);
        const base64Digest = btoa(String.fromCharCode(...new Uint8Array(digest)));
        return base64Digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    async authenticate() {
        const codeVerifier = this.generateRandomString(128);
        const codeChallenge = await this.generateCodeChallenge(codeVerifier);
        localStorage.setItem(Spotify.prefix+'CodeVerifier', codeVerifier);
        
        const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${Spotify.APIKey}&scope=${encodeURIComponent(Spotify.scopes)}&redirect_uri=${encodeURIComponent(Spotify.redirectUri)}&code_challenge_method=S256&code_challenge=${codeChallenge}`;
        window.location.href = url;
    }

    async fetchPlaylists() {
        try {
            const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
                headers: {
                    'Authorization': `Bearer ${this.getAccessToken()}`
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
        element.innerHTML = '';
        this.playlists.forEach(playlist => {
            const option = document.createElement('option');
            option.value = playlist.url;
            option.textContent = playlist.name;
            element.appendChild(option);
        });
    }

    getAccessToken() {
        return localStorage.getItem(Spotify.prefix + 'AccessToken');
    }

    setAccessToken(token) {
        localStorage.setItem(Spotify.prefix + 'AccessToken', token);
    }
}

export default Spotify;