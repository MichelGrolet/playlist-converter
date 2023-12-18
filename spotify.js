async function fetchSpotifyPlaylists(token) {
    try {
        const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
            headers: {
                'Authorization': `Bearer ${token}`
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

function fillPlaylistSelector(playlists) {
    const selector = document.getElementById('playlistSelector');
    playlists.forEach(playlist => {
        const option = document.createElement('option');
        option.value = playlist.url;
        option.textContent = playlist.name;
        selector.appendChild(option);
    });
}

function displayPlaylists(playlists) {
    const container = document.getElementById('playlistContainer');
    playlists.forEach(playlist => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = playlist.url;
        link.textContent = playlist.name;
        link.target = '_blank';

        item.appendChild(link);
        container.appendChild(item);
    });
}

(async function() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    if (accessToken) {
        const playlists = await fetchSpotifyPlaylists(accessToken);
        displayPlaylists(playlists);
        fillPlaylistSelector(playlists);
    } else {
        console.error('Access token not found');
    }
})();
