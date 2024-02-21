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

    async cleanLocalStorage() {
        localStorage.removeItem(YouTubeMusic.prefix+'AccessToken');
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
                    maxResults: 50  // Adjust as needed
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

    async fetchPlaylistData(playlistId) {
        try {
            const response = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
                params: {
                    part: 'contentDetails,snippet',
                    playlistId: playlistId,
                    maxResults: 50  // Adjust as needed
                },
                headers: {
                    'Authorization': `Bearer ${this.getAccessToken()}`
                }
            });
            const tracks = response.data.items.map(track => ({
                name: track.contentDetails.title,
                author: track.snippet.channelTitle,
                id: track.id
            }));
            console.log(tracks);
            return {
                name: response.data.items[0].snippet.playlistTitle,
                description: response.data.items[0].snippet.description,
                tracks: tracks
            };
        } catch {
            console.error('Error fetching YouTube playlists:', error);
            return [];
        }
    }

    async createPlaylist(data) {
        try {
            const response = await axios.post('https://www.googleapis.com/youtube/v3/playlists', {
                snippet: {
                    title: data.name,
                    description: data.description
                },
                status: {
                    privacyStatus: 'public'
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${this.getAccessToken()}`
                }
            });
            const playlistId = response.data.id;
            console.log('Playlist created with ID:', playlistId);

            this.addTracksToPlaylist(data.tracks, playlistId);

            return playlistId;
        } catch (error) {
            console.error('Error creating playlist:', error);
        }
    }

    async addTracksToPlaylist(tracks) {
        const playlistId = 'YOUR_PLAYLIST_ID';

        // 2. Loop through the tracks and add them to the playlist
        tracks.forEach(async (track) => {
            try {
                const response = await axios.post('https://www.googleapis.com/youtube/v3/playlistItems', {
                    snippet: {
                        playlistId: playlistId,
                        resourceId: {
                            kind: 'youtube#video',
                            videoId: track.id
                        }
                    }
                }, {
                    headers: {
                        'Authorization': `Bearer ${this.getAccessToken()}`
                    }
                });
                console.log('Track added to playlist:', track.name);
            } catch (error) {
                console.error('Error adding track to playlist:', error);
            }
        });
    }

    addTracksToPlaylist(tracks) {
        throw new Error("Method 'addTracksToPlaylist()' must be implemented.");
    }
}

export default YouTubeMusic;