export default class MusicProviderInterface {
    static instance = null;
    static APIKey = "";
    static scopes = "";
    static prefix = "";
    static name = "";

    constructor() {
        if (this.constructor === MusicProviderInterface) {
            throw new Error("Abstract classes can't be instantiated.");
        }
    }

    async authenticate() {
        throw new Error("Method 'authenticate()' must be implemented.");
    }

    async fetchPlaylists() {
        throw new Error("Method 'fetchPlaylists()' must be implemented.");
    }

    fillPlaylistSelector() {
        throw new Error("Method 'displayPlaylists()' must be implemented.");
    }

    async fetchPlaylist(playlistId) {
        throw new Error("Method 'fetchTracks()' must be implemented.");
    }

    async createPlaylist(data) {
        throw new Error("Method 'createPlaylist()' must be implemented.");
    }

    async addTracksToPlaylist(playlistId, tracks) {
        throw new Error("Method 'addTracksToPlaylist()' must be implemented.");
    }
}
