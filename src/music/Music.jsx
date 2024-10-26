import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Tilt } from 'react-tilt'
import { useParams } from 'react-router-dom';
import './Music.css';
import { useNavigate } from 'react-router-dom';
import exportIcon from '../assets/export.png';
import musicIcon from '../assets/sound.png';
import { RotatingLines } from 'react-loader-spinner';

export function ManagePage({ spotify_access_token, handle_spotify_error }) {
    const navigate = useNavigate();
    const [syncing, setSyncing] = useState(false);
    const [sync_in_progress_interval, setSyncInProgressInterval] = useState(null);

    useEffect(() => {
        check_sync_in_progress();
        return () => {
            clearInterval(sync_in_progress_interval);
        }
    }, [])

    const sync_subscribed_artists = async () => {
        setSyncing(true);
        // So, ignore everything above, what this function does is call the /update_subscribed_artist_releases endpoint in the backend server
        fetch(`${import.meta.env.VITE_SERVER_URL}/update_subscribed_artist_releases`).then(res => res.json()).then(data => {
            console.log(data);
            setSyncing(false);
            // Start the interval to check if sync is in progress
            const interval = setInterval(() => {
                check_sync_in_progress();
            }, 10000);

            setSyncInProgressInterval(interval);
        })
    }

    // every ten seconds, check if sync is in progress with endpoint /get_sync_in_progress
    const check_sync_in_progress = () => {
        fetch(`${import.meta.env.VITE_SERVER_URL}/get_sync_in_progress`).then(res => res.json()).then(data => {
            console.log(data);
            if (data.syncing) {
                setSyncing(true);
            } else {
                setSyncing(false);
            }
        })
    }

    const update_library_stats = () => {
        fetch(`${import.meta.env.VITE_SERVER_URL}/update_library_stats`).then(res => res.json()).then(data => {
            console.log(data);
        })
    }

    // get_all_downloads endpoint
    const get_all_downloads = () => {
        fetch(`${import.meta.env.VITE_SERVER_URL}/get_all_downloads`).then(res => res.json()).then(data => {
            console.log(data);
        })
    }

    return (
        <div className="MusicPage">
            <h1>Music</h1>
            <p>Work in Progress Feature</p>
            <p>Download your Spotify Music in Flac Format for High Quality Streaming!</p>
            <br />
            {/* Spotify auth button */}
            {/* {spotify_access_token == null && <SpotifyAuthButton />} */}
            {/* {spotify_access_token != null && <button disabled={syncing} onClick={sync_subscribed_artists}>{syncing ? `Sync In Progress` : "Sync Subscribed Artists"}</button>} */}
            {syncing && <><br /><br /><p>You can do other stuff while artist data is syncing, it's no big deal, takes a little bit too.</p><br /></>}
            {/* Also have a button to update library stats  */}
            <button onClick={update_library_stats}>Update Library Stats</button>
            <RequestedLibraryManager />
            {/* {spotify_access_token != null && <RecommendedArtists handle_spotify_error={handle_spotify_error} spotify_access_token={spotify_access_token} />} */}
            {/* If spotify_access_token is not null, show the sync_subscribed_artists button */}
            <button onClick={get_all_downloads}>Get All Downloads</button>
        </div>
    )
}

export function MusicExplorePage({ spotify_access_token, handle_spotify_error }) {
    // This function shows you related artists to your subscribed artists
    const [related_artists, setRelatedArtists] = useState(null);
    const [subscribed_artists, setSubscribedArtists] = useState(null);
    const [subscribed_artists_data, setSubscribedArtistsData] = useState(null);
    const [backgroundImage, setBackgroundImage] = useState(null);
    useEffect(() => {
        fetch(`${import.meta.env.VITE_SERVER_URL}/get_subscribed_artists`).then(res => res.json()).then(data => {
            console.log(data);
            setSubscribedArtists(data);
            data.forEach((artist_id, idx) => {
                setTimeout(() => {
                    getRelatedArtists(artist_id);
                }, 15000 * idx)
            })
        })
        fetch(`${import.meta.env.VITE_SERVER_URL}/get_subscribed_artist_data`).then(res => res.json()).then(data => {
            console.log("Subscribed Artists Data: ", data);
            setSubscribedArtistsData(data);
        });
    }, [])

    const getRelatedArtists = (artist_id) => {
        // We're gonna need to get the artist name as well, its super ineficient, but like, whatever
        fetch(`${import.meta.env.VITE_SERVER_URL}/get_related_artists/${artist_id}`).then(res => {
            if (res.ok) {
                return res.json();
            }
            throw new Error("Network response was not ok");
        }).then(artist_data => {
            console.log("Related Artist", artist_data);
            if (!backgroundImage) {
                setBackgroundImage(artist_data.related_artists[Math.floor(Math.random() * artist_data.related_artists.length)].images[0].url);
            }
            setRelatedArtists((prev) => {
                if (prev == null) {
                    return [{
                        name: artist_data.artist_name,
                        related_artists: artist_data.related_artists
                    }]
                } else {
                    return [...prev, {
                        name: artist_data.artist_name,
                        related_artists: artist_data.related_artists
                    }]
                }
            })
        }).catch((error) => {
            console.error("Error: ", error);
        })

    };

    return (
        <div className="MusicPage">
            {/* Background image */}
            <div className="SpotifyCollectionBackgroundImage">
                {backgroundImage && <img src={backgroundImage} alt="Artist Background" />}
            </div>
            <h1>Explore</h1>
            <p>Here's Some Artists I Think You Might Like</p>
            {related_artists != null && related_artists.map((artist, idx) => {
                return <>
                    <h1>Artists Similar to {artist.name}</h1>
                    <div className="RecommendedArtistsList">
                        {artist.related_artists.map((related_artist, idx) => {
                            return <ArtistItem key={idx} artist={related_artist} subscribed_artists_data={subscribed_artists_data} />
                        })}
                    </div>
                </>
            })}
        </div>
    )

}


function RequestedLibraryManager() {
    // This is a fun one
    // On mount, call /get_library_stats to get the library stats, then display them
    const [library_stats, setLibraryStats] = useState(null);
    const [progressWidth, setProgressWidth] = useState(0);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_SERVER_URL}/get_library_stats`).then(res => res.json()).then(data => {
            console.log(data);
            // You'll get an object with the properties: queued, processing, downloading, downloaded, download_failed, search_failed
            // Display this information in a nice way

            // Calculate the progress width
            // So what we're doing is getting the total of all the items, and then getting the percentage of the processing items
            // And setting the progress width to that percentage
            let total_items = data.queued + data.processing + data.downloading + data.downloaded + data.download_failed + data.search_failed;
            setProgressWidth(((data.processing) / total_items) * 100);
            setLibraryStats(data);
        })
    }, [])

    return (
        <div className="RequestedLibraryManager">
            <h2>Stats</h2>
            {
                library_stats != null &&
                <>
                    <p>Queued: {library_stats.queued}</p>
                    <p>Processing: {library_stats.processing}</p>
                    <p>Downloading: {library_stats.downloading}</p>
                    <p>Downloaded: {library_stats.downloaded}</p>
                    <p>Download Failed: {library_stats.download_failed}</p>
                    <p>Search Failed: {library_stats.search_failed}</p>
                    {/* Lets display a progress bar to show how many of the total of all the properties are processing */}
                    {/* <div className="SubscribedItemsProgressBar">
                            <div className="SubscribedItemsProgressBarInner" style={{
                                width: `${progressWidth}%`
                            }}></div>
                        </div> */}
                </>
            }
        </div>
    )

}

export function SpotifyPlaylistBrowser({ spotify_access_token, handle_spotify_error }) {
    const [playlists, setPlaylists] = useState([]);
    // Lists the spotify playlists of the user
    // Catch any error, if it's a 401, we'll call the handle_spotify_error

    useEffect(() => {
        if (spotify_access_token == null) return;
        fetch('https://api.spotify.com/v1/me/playlists', {
            headers: {
                'Authorization': 'Bearer ' + spotify_access_token
            }
        }).then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error("Network response was not ok");
        })
            .then(data => {
                console.log("Playlists: ", data.items);
                setPlaylists(data.items);
            })
            .catch((error) => {
                console.error("Error: ", error);
                handle_spotify_error();
            })

    }, [spotify_access_token])

    return (
        <div className="MusicPage"
        >
            {/* Background image overlay that will be blurred, and set to a random playlist's image */}
            <div className="SpotifyCollectionBackgroundImage">
                {playlists.length > 0 && <img src={playlists[Math.floor(Math.random() * playlists.length)].images[0].url} alt="Playlist Background" />}
            </div>

            <h2>Your Playlists</h2>
            {playlists != null &&
                playlists.map((playlist, idx) => {
                    return <PlaylistItem key={idx} playlist={playlist} />
                })
            }
        </div>
    )
}


export function PlaylistExplorer({ spotify_access_token, handle_spotify_error }) {
    // Use params to get the playlist id
    let { playlist_id } = useParams();
    const [playlist, setPlaylist] = useState(null);
    useEffect(() => {
        if (spotify_access_token == null) return;

        fetch(`https://api.spotify.com/v1/playlists/${playlist_id}`, {
            headers: {
                'Authorization': 'Bearer ' + spotify_access_token
            }
        })
            .then((response) => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error("Network response was not ok");
            })
            .then(data => {
                console.log("Playlist: ", data);
                setPlaylist(data);
            })
            .catch((error) => {
                console.error("Error: ", error);
                handle_spotify_error(error);
            })
    }, [playlist_id, spotify_access_token])

    const exportPlaylist = () => {
        let export_object = []
        // Just export the items with their name and artist
        playlist.tracks.items.map((track) => {
            export_object.push({
                song: track.track.name,
                artists: track.track.artists[0].name,
                album: track.track.album.name
            })
        })
        // fetch to /api/update_shadow_library post request with the export object
        fetch(`${import.meta.env.VITE_SERVER_URL}/update_shadow_library`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                new_songs: export_object
            })
        }).then(res => res.json()).then(data => {
            console.log(data);
        });
    }

    return (
        <div className="CollectionPage">
            {playlist != null && <>

                <div className="MusicPageBackground">
                    <img src={playlist.images[0].url} alt="Playlist Background" />
                </div>
                <h2 className="CollectionHeaderName">{playlist.name}</h2>
                <div className="CollectionContainer">
                    <div className="CollectionExplorerHeader">
                        <img className="CollectionArt" src={playlist.images[0].url} alt="Playlist Art" />
                        <div className="CollectionHeaderInfo">
                            <p>By {playlist.owner.display_name}</p>
                            <br />
                            {/* Download button */}
                            <button onClick={exportPlaylist}>Download Playlist</button>
                        </div>
                    </div>
                    {playlist.tracks != undefined &&
                        <div className="CollectionExplorerBody">
                            <div className="TrackList">
                                {playlist.tracks.items.map((track, idx) => {
                                    return <TrackItem key={idx} track={track.track} />
                                })}
                            </div>
                        </div>
                    }
                </div>
            </>}
        </div>
    )

}

export function SpotifyAlbumsBrowser({ spotify_access_token, handle_spotify_error }) {
    const [albums, setAlbums] = useState([]);

    // Let's get our subscribed albums
    useEffect(() => {
        if (spotify_access_token == null) return;
        fetch('https://api.spotify.com/v1/me/albums', {
            headers: {
                'Authorization': 'Bearer ' + spotify_access_token
            }
        }).then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error("Network response was not ok");
        })
            .then(data => {
                console.log("Albums: ", data.items);
                setAlbums(data.items);
            })
            .catch((error) => {
                console.error("Error: ", error);
                handle_spotify_error();
            })

    }, [spotify_access_token])

    return (
        <div className="MusicPage">
            <div className="SpotifyCollectionBackgroundImage">
                {albums.length > 0 && <img src={albums[Math.floor(Math.random() * albums.length)].album.images[0].url} alt="Album Background" />}
            </div>
            <h2>Your Albums</h2>
            {albums != null &&
                albums.map((album, idx) => {
                    return <AlbumItem key={idx} album={album.album} />
                })
            }
        </div>
    )
}


export function AlbumExplorer() {
    let { album_id } = useParams();
    const [album, setAlbum] = useState(null);
    const [subscribed_artists_data, setSubscribedArtistsData] = useState(null);
    useEffect(() => {
        // Fetch the endpoint /get_album/album_id
        fetch(`${import.meta.env.VITE_SERVER_URL}/get_album/${album_id}`).then(res => res.json()).then(data => {
            console.log("Album: ", data);
            setAlbum(data);
        })

        // Also get the subscribed artists data
        fetch(`${import.meta.env.VITE_SERVER_URL}/get_subscribed_artist_data`).then(res => res.json()).then(data => {
            console.log("Subscribed Artists Data: ", data);
            setSubscribedArtistsData(data);
        });
    }, [album_id])

    return (
        <div className="CollectionPage">
            {album != null && <>
                <div className="MusicPageBackground">
                    <img src={album.images[0].url} alt="Album Background" />
                </div>
                <h2 className="CollectionHeaderName">{album.name}</h2>
                <div className="CollectionContainer">
                    <div className="CollectionExplorerHeader">
                        <img className="CollectionArt" src={album.images[0].url} alt="Album Art" />
                        <div className="CollectionHeaderInfo">
                            <h2>by {album.artists.map((artist) => artist.name).join(", ")}</h2>
                            <br />
                            {/* Download button */}
                            <button onClick={() => {
                                let export_object = []
                                // Just export the items with their name and artist
                                album.tracks.items.map((track) => {
                                    export_object.push({
                                        song: track.name,
                                        artists: track.artists[0].name,
                                        album: album.name
                                    })
                                })
                                // fetch to /api/update_shadow_library post request with the export object
                                fetch(`${import.meta.env.VITE_SERVER_URL}/update_shadow_library`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        new_songs: export_object
                                    })
                                }).then(res => res.json()).then(data => {
                                    console.log(data);
                                });
                            }}>Download Album</button>
                        </div>

                    </div>
                    {album.tracks != undefined &&
                        <div className="CollectionExplorerBody">
                            <div className="TrackList">
                                {album.tracks.items.map((track) => {
                                    return <TrackItem show_art={false} track={track} album={album} show_artist={false} subscribed_artists_data={subscribed_artists_data} />
                                })}
                            </div>
                        </div>
                    }

                </div>
            </>}
        </div>
    )
}

export function SubscribedArtistsBrowser() {
    // Shows Related Artists to the user's subscribed artists
    const [artists, setArtists] = useState([]);
    const [chosen_background, setChosenBackground] = useState(null);
    const [subscribed_artists_data, setSubscribedArtistsData] = useState(null);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_SERVER_URL}/get_subscribed_artists_data`)
            .then(res => res.json())
            .then(data => {
                console.log("Subscribed Artists: ", data);
                setArtists(data);
                setChosenBackground(data[Math.floor(Math.random() * data.length)].images[0].url);
            })
        fetch(`${import.meta.env.VITE_SERVER_URL}/get_subscribed_artist_data`).then(res => res.json()).then(data => {
            console.log("Subscribed Artists Data: ", data);
            setSubscribedArtistsData(data);
        });
    }, [])

    return (
        <div className="MusicPage">
            <div className="SpotifyCollectionBackgroundImage">
                {artists.length > 0
                    && <img src={chosen_background} alt="Artist Background" />}
            </div>
            <h2>Subscribed Artists</h2>
            {artists != null &&

                artists.map((artist, idx) => {
                    return <ArtistItem key={idx} artist={artist} subscribed_artists_data={subscribed_artists_data} />
                })
            }
        </div>
    )
}

export function ArtistExplorer({ spotify_access_token, handle_spotify_error }) {
    let { artist_id } = useParams();
    const [artist, setArtist] = useState(null);
    const [artist_top_tracks, setArtistTopTracks] = useState(null);
    const [artist_albums, setArtistAlbums] = useState(null);
    const [user_is_subscribed, setUserIsSubscribed] = useState(false);
    const [subscribed_artists_data, setSubscribedArtistsData] = useState(null);
    const [downloadProgress, setDownloadProgress] = useState(null);
    useEffect(() => {
        fetch(`${import.meta.env.VITE_SERVER_URL}/get_artist/${artist_id}`).then(res => res.json()).then(data => {
            console.log("Artist: ", data);
            setArtist(data.artist);
            setArtistTopTracks(data.top_tracks);
            setArtistAlbums(data.albums);
        })
        // Returns an object with artist, top_tracks, and albums


        // Also get the user's subscribed artists, using the backend /get_subscribed_artists endpoint
        // If the artist is in the subscribed artists, we'll set the user_is_subscribed to true
        fetch(`${import.meta.env.VITE_SERVER_URL}/get_subscribed_artists`).then(res => res.json()).then(data => {
            console.log("Subscribed Artists: ", data);
            if (data.includes(artist_id)) {
                setUserIsSubscribed(true);
            }
            // Get subscribed artists data
            fetch(`${import.meta.env.VITE_SERVER_URL}/get_subscribed_artist_data`).then(res => res.json()).then(data => {
                console.log("Subscribed Artists Data: ", data);
                setSubscribedArtistsData(data);
                if (data[artist_id]) {
                    setDownloadProgress(data[artist_id].download_progress * 100);
                }
            });
        })
    }, [artist_id, spotify_access_token])



    const subscribe_to_artist = () => {
        // This calls the backend /subscribe_to_artist/artist_name endpoint
        fetch(`${import.meta.env.VITE_SERVER_URL}/subscribe_to_artist/${artist_id}`)
            .then(res => res.json())
            .then(data => {
                console.log(data);
                // Data returns the array of subscribed artists, which is just an array of artist ids
                // If the artist_id is in the array, we'll set user_is_subscribed to true
                if (data.includes(artist_id)) {
                    setUserIsSubscribed(true);
                } else {
                    setUserIsSubscribed(false);
                }
            })
    }


    // Similar to other explorer pages, but we'll show the artist's top tracks as well as their albums, which will be album items
    return (
        <div className="CollectionPage">
            {artist != null && <>
                <div className="MusicPageBackground">
                    <img src={artist.images[0].url} alt="Artist Background" />
                </div>
                <h1 className="CollectionHeaderName">{artist.name}</h1>
                <div className="CollectionContainer">

                    <div className="CollectionExplorerHeader">
                        <img className="CollectionArt" src={artist.images[0].url} alt="Artist Background" />
                        <div className="CollectionHeaderInfo">

                            <p>{artist.genres.join(", ")}</p>
                            <br />
                            {/* Button to subscribe to artist */}
                            <button onClick={subscribe_to_artist}>{user_is_subscribed ? "Subscribed / " + (downloadProgress ? (downloadProgress == 100 ? "Fully Synced" : downloadProgress.toFixed(2) + "% Synced") : "0% Synced") : "Subscribe"}</button>
                            <br />
                            <br />

                            <h2>Top Tracks</h2>
                            {artist_top_tracks != undefined &&
                                <div className="TrackList">
                                    {artist_top_tracks.map((track) => {
                                        return <TrackItem track={track} show_artist={false} subscribed_artists_data={subscribed_artists_data} />
                                    })}
                                </div>
                            }
                        </div>
                    </div>
                    <div className="CollectionExplorerBody">
                        {artist_albums != undefined &&
                            <>
                                <h2>Albums</h2>
                                {artist_albums
                                    .filter((album) => album.album_type == "album")
                                    .map((album) => {
                                        return <AlbumItem album={album} show_name={true} subscribed_artists_data={subscribed_artists_data} />
                                    })}
                                {artist_albums
                                    .filter((album) => album.album_type == "single").length > 0 && <h2>Singles</h2>}
                                {artist_albums
                                    .filter((album) => album.album_type == "single")
                                    .map((album) => {
                                        return <AlbumItem show_name={true} album={album} subscribed_artists_data={subscribed_artists_data} />
                                    })}

                            </>
                        }
                    </div>
                </div>
            </>}
        </div>
    )
}

export function MusicSearch() {
    // search query is passed in url with useparams
    let { search_query } = useParams();
    let { page } = useParams();
    const [search_results, setSearchResults] = useState(null);
    useEffect(() => {
        fetch(`${import.meta.env.VITE_SERVER_URL}/search/${search_query}`)
            .then(res => res.json())
            .then(data => {
                console.log("Search Results: ", data);
                setSearchResults(data);
            })
    }, [search_query])

    return (
        <div className="SearchResults">
            {search_results != null &&
                <>
                    {/* <div className="SpotifyCollectionBackgroundImage">
                        {search_results.albums.items.length > 0 && <img src={search_results.albums.items[Math.floor(Math.random() * search_results.albums.items.length)].images[0].url} alt="Album Background" />}
                    </div> */}
                    <br />
                    <h2>Search Results for: {search_query}</h2>
                    <br />
                    <h1>Artists</h1>
                    {search_results.artists.items.map((artist, idx) => {
                        return <ArtistItem key={idx} artist={artist} />
                    })}
                    <br />
                    <br />
                    <h1>Tracks</h1>
                    <br />
                    <div className="TrackList">
                        {search_results.tracks.items.map((track, idx) => {
                            return <TrackItem key={idx} track={track} />
                        })}
                    </div>
                    <br />
                    <br />
                    <h1>Albums</h1>
                    <br />
                    {search_results.albums.items.map((album, idx) => {
                        return <AlbumItem key={idx} album={album} />
                    })}
                </>
            }
        </div>
    )
}

function PlaylistItem({ playlist }) {
    const navigate = useNavigate();
    return (
        <Tilt
            options={{
                maxTilt: 15,
                perspective: 1500,
                easing: "cubic-bezier(.03,.98,.52,.99)",
                speed: 2000,
                glare: false,
                maxGlare: 1,
                glare: true,
                scale: 1.02,
                reverse: true
            }}

            // Onclick, navigate to the playlist explorer, at /music/playlists/:playlist_id


            className="SpotifyCollectionItemTilt"
            style={{
                backgroundImage: `url(${playlist.images[0].url})`,
            }}

        >
            <div className="SpotifyCollectionItem"
                onClick={() => {
                    console.log("Navigating to: ", `/music/playlist/${playlist.id}`);
                    navigate(`/music/playlist/${playlist.id}`)
                }}
            >
                <span className="CollectionName"
                >{playlist.name}</span>
            </div>
        </Tilt>
    )

}


function ArtistItem({ artist, subscribed_artists_data, size = 400 }) {
    const navigate = useNavigate();
    const [download_progress, setDownloadProgress] = useState(null);
    const [animation_progress, setAnimationProgress] = useState(0);
    useEffect(() => {
        if (subscribed_artists_data == null || artist == null) return;
        let dl_data = subscribed_artists_data[artist.id];
        if (dl_data) {
            setDownloadProgress(dl_data.download_progress * 100);
        }
    }, [artist, subscribed_artists_data]);

    useEffect(() => {
        if (download_progress !== null) {
            const timeout = setTimeout(() => {
                setAnimationProgress(download_progress); // Animate from 0 to the actual progress
            }, 250); // Delay to ensure the animation triggers after mount
            return () => clearTimeout(timeout);
        }
    }, [download_progress]);

    // Adjust circle radius and stroke width based on size
    const strokeWidth = size * 0.04;  // Reduced stroke width to 2% of size
    const circleRadius = (size / 2);  // Radius adjusted to ensure it fits inside the container
    const circumference = 2 * Math.PI * circleRadius;  // Circumference for progress calculation

    return (
        <Tilt
            options={{
                maxTilt: 15,
                perspective: 1500,
                easing: "cubic-bezier(.03,.98,.52,.99)",
                speed: 2000,
                glare: true,
                maxGlare: 1,
                scale: 1.02,
                reverse: true,
            }}
            className="SpotifyCollectionItemTilt"
            style={{
                width: `${size}px`,          // Dynamically set the width
                height: `${size}px`,         // Dynamically set the height
                borderRadius: '50%',         // Ensure it's circular
            }}
        >
            {download_progress !== null && (
                <svg
                    className="ProgressCircle"
                    viewBox={`0 0 ${size + 20} ${size + 20}`} // Dynamically set the viewBox
                    preserveAspectRatio="xMidYMid meet"
                    style={{
                        width: `${size + 20}px`,   // Set SVG width dynamically
                        height: `${size + 20}px`,  // Set SVG height dynamically
                        overflow: 'visible',       // Allow overflow for progress circle
                    }}
                >
                    {/* Outer border circle */}
                    <circle
                        cx={size / 2}         // Center the circle based on size
                        cy={size / 2}         // Center the circle based on size
                        r={circleRadius}      // Adjust radius based on size
                        fill="none"
                        stroke="black"
                        strokeWidth={strokeWidth}  // Use reduced stroke width
                    />
                    {/* Progress circle */}
                    <circle
                        cx={size / 2}         // Center the progress circle based on size
                        cy={size / 2}         // Center the progress circle based on size
                        r={circleRadius}      // Adjust radius for progress circle
                        fill="none"
                        stroke="white"
                        strokeWidth={strokeWidth}  // Use same stroke width for progress
                        strokeDasharray={circumference}  // Set stroke dash array based on circumference
                        strokeDashoffset={circumference - (circumference * animation_progress / 100)}  // Calculate offset for progress
                        strokeLinecap="round" // Round ends of the progress stroke
                        style={{
                            transition: 'stroke-dashoffset 1s ease-in-out'  // Smooth transition for the animation
                        }}
                    />
                </svg>
            )}
            <div
                className="SpotifyCollectionItem Circle"
                style={{
                    width: '100%',            // Fill the parent element
                    height: '100%',           // Fill the parent element
                    borderRadius: '50%',      // Make sure the image stays circular
                    backgroundImage: artist.images?.length > 0 ? `url(${artist.images[0].url})` : `url(${musicIcon})`,
                    backgroundSize: artist.images?.length > 0 ? 'cover' : 'contain',
                }}
                onClick={() => {
                    console.log("Navigating to: ", `/music/artist/${artist.id}`);
                    navigate(`/music/artist/${artist.id}`);
                }}
            >
                <span className="CollectionName">{artist.name}</span>
            </div>
        </Tilt>
    );
}






function AlbumItem({ album, show_name = true, subscribed_artists_data = null, size = 400 }) {
    const navigate = useNavigate();
    const [download_progress, setDownloadProgress] = useState(null);
    const [animationProgress, setAnimationProgress] = useState(0);

    // Use the subscribed artists data to determine album download progress
    useEffect(() => {
        if (subscribed_artists_data == null || album == null) return;
        if (album.artists.length == 0) return;
        if (!subscribed_artists_data[album.artists[0].id]) return;
        let dl_data = subscribed_artists_data[album.artists[0].id].albums.items.find((item) => item.name == album.name);
        if (dl_data) {
            setDownloadProgress(dl_data.download_progress * 100);
        }
    }, [album, subscribed_artists_data]);

    // Animation effect to trigger when the component mounts
    useEffect(() => {
        if (download_progress !== null) {
            const timeout = setTimeout(() => {
                setAnimationProgress(download_progress); // Animate from 0 to the actual progress
            }, 100); // Delay to ensure the animation triggers after mount
            return () => clearTimeout(timeout);
        }
    }, [download_progress]);

    // Adjust circle radius and stroke width based on size
    const strokeWidth = size * 0.04;  // Reduced stroke width to 2% of size
    const circleRadius = (size / 2);  // Radius adjusted to ensure it fits inside the container
    const circumference = 2 * Math.PI * circleRadius;  // Circumference for progress calculation

    return (
        <Tilt
            options={{
                maxTilt: 15,
                perspective: 1500,
                easing: "cubic-bezier(.03,.98,.52,.99)",
                speed: 2000,
                glare: true,
                maxGlare: 1,
                scale: 1.02,
                reverse: true,
            }}
            className="SpotifyCollectionItemTilt"
            style={{
                width: `${size}px`,          // Dynamically set the width
                height: `${size}px`,         // Dynamically set the height
                borderRadius: '50%',         // Ensure it's circular
                backgroundImage: `url(${album.images[0].url})`,
                backgroundSize: 'cover',
            }}
        >
            {/* Progress circle, animating when progress exists */}
            {download_progress !== null && (
                <svg
                    className="ProgressCircle"
                    viewBox={`0 0 ${size + 20} ${size + 20}`} // Dynamically set the viewBox
                    preserveAspectRatio="xMidYMid meet"
                    style={{
                        width: `${size + 20}px`,   // Set SVG width dynamically
                        height: `${size + 20}px`,  // Set SVG height dynamically
                        overflow: 'visible',       // Allow overflow for progress circle
                    }}
                >
                    {/* Outer border circle */}
                    <circle
                        cx={size / 2}         // Center the circle based on size
                        cy={size / 2}         // Center the circle based on size
                        r={circleRadius}      // Adjust radius based on size
                        fill="none"
                        stroke="black"
                        strokeWidth={strokeWidth}  // Use reduced stroke width
                    />
                    {/* Progress circle */}
                    <circle
                        cx={size / 2}         // Center the progress circle based on size
                        cy={size / 2}         // Center the progress circle based on size
                        r={circleRadius}      // Adjust radius for progress circle
                        fill="none"
                        stroke="white"
                        strokeWidth={strokeWidth}  // Use same stroke width for progress
                        strokeDasharray={circumference}  // Set stroke dash array based on circumference
                        strokeDashoffset={circumference - (circumference * animationProgress / 100)}  // Animate offset for progress
                        strokeLinecap="round" // Round ends of the progress stroke
                        style={{
                            transition: 'stroke-dashoffset 4s ease-in-out'  // Smooth transition for the animation
                        }}
                    />
                </svg>
            )}
            <div
                className="SpotifyCollectionItem Circle"
                style={{
                    width: '100%',            // Fill the parent element
                    height: '100%',           // Fill the parent element
                    borderRadius: '50%',      // Ensure circular image
                }}
                onClick={() => {
                    console.log("Navigating to: ", `/music/album/${album.id}`);
                    navigate(`/music/album/${album.id}`);
                }}
            >
                <span className={`CollectionName ${show_name ? " ShowName" : ""}`}>
                    {album.name}
                </span>
            </div>
        </Tilt>
    );
}

function TrackItem({ track, album, show_art = true, show_artist = true, subscribed_artists_data }) {

    const [albumData, setAlbumData] = useState(null);
    const [is_downloaded, setIsDownloaded] = useState(false);
    const [track_state, setTrackState] = useState("Get");
    useEffect(() => {
        if (track.album == undefined) {
            if (album != undefined) {
                setAlbumData(album);
            }
        } else {
            setAlbumData(track.album);
        }
        get_track_state_in_database();
    }, [album, track])

    useEffect(() => {
        // Check if the track is in the subscribed artists data
        // To do this, we need to go through the subscribed_artist_data["artist_id"]["albums"]["items"] and find the item with the the album name with the same name as the track.album.name
        // Then, we find the item in that object's "tracks" array with the same name as the track.name
        // Then, we check if that item's state is "downloaded"
        // If all this is true, then the item is downloaded, so go get em champ
        console.log("This track thinks subscribed artists data is: ", subscribed_artists_data);
        if (subscribed_artists_data == null) return;
        if (albumData == null) return;
        check_if_is_downloaded();
    }, [subscribed_artists_data, albumData])

    const check_if_is_downloaded = () => {
        console.log("Checking if track is downloaded: ", track.name);
        let downloaded = false;
        // Look for this artist's id in the subscribed artists data
        if (track.artists[0].id == undefined) return;
        let artist_id = track.artists[0].id;
        if (subscribed_artists_data[artist_id] == undefined) return;
        let artist_data = subscribed_artists_data[artist_id];
        if (artist_data.albums == undefined) return;
        let album_data = artist_data.albums.items.find((item) => item.name == albumData.name);
        if (album_data == undefined) return;
        let track_data = album_data.tracks.find((item) => item.name == track.name);
        if (track_data == undefined) return;
        downloaded = track_data.state == "downloaded";
        setIsDownloaded(downloaded);
    }

    const get_track_state_in_database = () => {
        fetch(`${import.meta.env.VITE_SERVER_URL}/get_track_download_status/${track.id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(res => res.json()).then(data => {
            console.log(data);
            setTrackState(data.state);
        });
    }

    const exportTrack = () => {
        // fetch to /api/update_shadow_library post request with the export object
        fetch(`${import.meta.env.VITE_SERVER_URL}/add_song_to_requested_library`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                song_id: track.id,
            })
        }).then(res => res.json()).then(data => {
            console.log(data);
        });
    }

    return (
        <div className="TrackItem">
            {show_art && albumData && <img className="TrackArt" src={albumData.images[0].url} alt="Album Art" />}

            <p className="TrackName">{track.name}</p>

            {show_artist && <p className="TrackArtist">{track.artists[0].name}</p>}
            <TrackItemGetButton exportTrack={exportTrack} trackState={track_state} />
        </div>
    )
}

function TrackItemGetButton({exportTrack, trackState}) {
    const [isHovered, setIsHovered] = useState(false);

    if (trackState == "processing"){
        return (
            <div className="TrackDownloadButton">
                <RotatingLines
                    visible={true}
                    height="100%"
                    width="100%"
                    color="white"
                    strokeWidth="5"
                    animationDuration="0.75"
                    ariaLabel="rotating-lines-loading"
                    // Make it centered in the parent
                    wrapperStyle={{
                        display: "inline-flex",
                        verticalAlign: "middle",
                        justifyContent: "center",
                        alignItems: "center",
                        margin: "auto"
                    }}
                    wrapperClass=""/>
            </div>
        )
    }
    if (trackState == "search_failed"){
        // If hovered, change the text to "Retry"
        return (
            <div
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            className="TrackDownloadButton">
                <span>{isHovered ? "Retry" : "Search Failed"}</span>
            </div>
        )
    }
    if (trackState == "downloaded"){
        return (
            <div className="TrackDownloadButton">
                <span>Play</span>
            </div>
        )
    }
    return (
        <div onClick={exportTrack} className="TrackDownloadButton">
            <span>Get</span>
        </div>
    )
}