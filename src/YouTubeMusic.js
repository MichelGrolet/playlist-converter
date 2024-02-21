import MusicProviderInterface from './MusicProviderInterface.js';
import 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js';
const CORSPrefix = '';

class YouTubeMusic extends MusicProviderInterface {
    static instance = null;
    static APIKey = "159861648417-pg4ftuci88bo8a9l4he1c6qbqjlk2s1b.apps.googleusercontent.com";
    static scopes = 'https://www.googleapis.com/auth/youtube';
    static prefix = "youTubeMusic";
    static name = "YouTube Music";
    static redirectUri = "http://localhost:5500/index.html";

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

    async fetchPlaylist(playlistId) {
        self = this;
        async function fetchPlaylistItems() {
            console.log(self.getAccessToken());
            try {
                const response = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
                    params: {
                        part: 'snippet',
                        playlistId: playlistId,
                        maxResults: 50
                    },
                    headers: {
                        'Authorization': `Bearer ${self.getAccessToken()}`
                    }
                });
                const tracks = response.data.items.map(track => ({
                    name: track.snippet.title,
                    author: track.snippet.videoOwnerChannelTitle
                }));
                return tracks;
            } catch (error) {
                console.error('Error fetching YouTube playlist items:', error);
                return [];
            }
        }

        async function fetchPlaylistData() {
            try {
                const response = await axios.get('https://www.googleapis.com/youtube/v3/playlists', {
                    params: {
                        part: 'snippet',
                        id: playlistId
                    },
                    headers: {
                        'Authorization': `Bearer ${self.getAccessToken()}`
                    }
                });
                const data = {
                    name: response.data.items[0].snippet.title,
                    description: response.data.items[0].snippet.description
                };
                return data;
            } catch (error) {
                console.error('Error fetching YouTube playlist data:', error);
                return {};
            }
        }

        const tracks = await fetchPlaylistItems();
        const { name, description } = await fetchPlaylistData();
        const data = {
            name: name,
            description: description,
            tracks: tracks
        };
        console.log("YouTubeMusic.fetchPlaylistData() data:");
        console.log(data);
        return data;
    }

    async createPlaylist(data) {
        try {
            const response = await axios.post(`${CORSPrefix}https://www.googleapis.com/youtube/v3/playlists`, {
                snippet: {
                    title: data.name,
                    description: data.description
                },
                status: {
                    privacyStatus: 'public'
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${this.getAccessToken()}`,
                }
            });
            const playlistId = response.data.id;
            console.log('Playlist created with ID:', playlistId);

            this.addTracksToPlaylist(playlistId, data.tracks);

            return playlistId;
        } catch (error) {
            console.error('Error creating playlist:', error);
        }
    }

    async addTracksToPlaylist(playlistId, tracks) {
        for (const track of tracks) {
            try {
                const response = await axios.post(`${CORSPrefix}https://www.googleapis.com/youtube/v3/playlistItems`, {
                    snippet: {
                        playlistId: playlistId,
                        resourceId: {
                            kind: 'youtube#video',
                            videoId: track.id
                        }
                    }
                }, {
                    headers: {
                        'Authorization': `Bearer ${this.getAccessToken()}`,
                    }
                });
                console.log('Track added to playlist:', track.name);
            } catch (error) {
                console.error('Error adding track to playlist:', error);
            }
        }
    }
}

export default YouTubeMusic;