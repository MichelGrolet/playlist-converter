import MusicProviderInterface from './MusicProviderInterface.js';
import 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js';
const CORSPrefix = '';

class Spotify extends MusicProviderInterface {
    static instance = null;
    static APIKey = "c46b5e32ccfa4cd583b351c58cb9f99d";
    static scopes = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public user-library-modify';
    static prefix = "spotify";
    static name = "Spotify";
    static redirectUri = "http://localhost:5500/index.html";

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

    async cleanLocalStorage() {
        localStorage.removeItem(Spotify.prefix+'AccessToken');
        localStorage.removeItem(Spotify.prefix+'CodeVerifier');
        
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

            let playlists = response.data.items.map(playlist => ({
                name: playlist.name,
                url: playlist.external_urls.spotify
            }));
            return playlists;
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

    async fetchPlaylist(playlistId) {
        try {
            const response = await axios.post(`https://api.spotify.com/v1/me/playlists/${playlistId}/tracks`, {
                headers: {
                    'Authorization': `Bearer ${this.getAccessToken()}`
                }
            });
            const tracks = response.data.items.map(track => ({
                name: track.name,
                author: track.artists[0].name
            }));
            console.log(tracks);
            return {
                name: response.data.name,
                description: response.data.description,
                tracks: tracks
            }
        } catch (error) {
            console.error('Error fetching Spotify playlists:', error);
            return [];
        }
    }

    async getUserId() {
        try {
            const response = await axios.get('https://api.spotify.com/v1/me', {
                headers: {
                    Authorization: `Bearer ${this.getAccessToken()}`,
                },
            });
            return response.data.id;
        } catch (error) {
            console.error('Error fetching user ID:', error);
            return null;
        }
    }

    async createPlaylist(data) {
        console.log('Creating a new playlist with data:');
        console.log(data);
        try {
            const userId = await this.getUserId();
            if (!userId) {
                throw new Error('User ID is missing.'); // Handle missing user ID
            }
            const response = await axios.post(`https://api.spotify.com/v1/users/${userId}/playlists`, {
                name: data.name,
                public: true,
                collaborative: false,
                description: data.description
            }, {
                headers: {
                    'Authorization': `Bearer ${this.getAccessToken()}`,
                }
            });

            const playlistId = response.data.id;

            this.addTracksToPlaylist(playlistId, data.tracks);

            return playlistId;
        } catch (error) {
            console.error('Error creating a new playlist:', error);
            return [];
        }
    }

    async addTracksToPlaylist(playlistId, tracks) {
        try {
            const accessToken = this.getAccessToken();
            if (!accessToken) {
                console.error('Access token is not defined');
                return;
            }
            let spotifyTracksURIsCSV = '';
            for (const track of tracks) {
                const trackResponse = await axios.get(`${CORSPrefix}https://api.spotify.com/v1/search`, {
                    q: `${track.name} ${track.author}`,
                    type: 'track',
                    limit: 1
                }, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    }
                });
                if (trackResponse.data.tracks.items[0].uri !== undefined && trackResponse.data.tracks.items[0].uri.startsWith('spotify:track:')) {
                    spotifyTracksURIsCSV += `${trackResponse.data.tracks.items[0].uri},`;
                }
            }
        } catch (error) {
            console.error('Error searching for tracks:', error);
            return [];
        }
        try {
            // add tracks to the playlist
            const response = await axios.post(`${CORSPrefix}https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                    uris: spotifyTracksURIsCSV,
                }, {
                    headers: {
                        'Authorization': `Bearer ${this.getAccessToken()}`,
                    }
                });
            return response.data;
        } catch (error) {
            console.error('Error adding tracks to the playlist:', error);
            return [];
        }
    }
}

export default Spotify;