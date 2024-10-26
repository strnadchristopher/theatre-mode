import React, { useState, useEffect, useRef } from 'react';
import { MovieCard } from './MovieCard.jsx';
import { json, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
// Import images add.png and check.png from assets folder
import add from '../assets/add.png';
import check from '../assets/check.png';
import { RotatingLines } from 'react-loader-spinner';

function MovieDetailsModal(props) {
  let { id } = useParams();
  let { media_type } = useParams();
  const [torrent_list, set_torrent_list] = useState([]);
  const [searching_for_torrents, set_searching_for_torrents] = useState(false);
  const [torrent_error, set_torrent_error] = useState(null);
  const [torrent_search_error, set_torrent_search_error] = useState(null);
  const [torrent_added, set_torrent_added] = useState(false);
  const [recommended_movies, set_recommended_movies] = useState([]);
  const [movie_details, set_movie_details] = useState({});
  const [movie_cast, set_movie_cast] = useState(null);
  const [movie_backdrops, set_movie_backdrops] = useState(null);
  const [current_backdrop, set_current_backdrop] = useState(0); // Create a ref to the movie details modal body so we can scroll it to the top
  const [search_input, set_search_input] = useState(null);
  const [event_source, set_event_source] = useState(null);
  const [search_source, set_search_source] = useState(null);
  const [search_completed, set_search_completed] = useState(false);
  const [torrents_found_count, set_torrents_found_count] = useState(0);
  const movie_details_modal_body = useRef(null);
  const release_date_ref = useRef(null);
  const [torrent_search_select_multiple, set_torrent_search_select_multiple] = useState(false);

  // On dismount, disconnect event source, if its not null
  useEffect(() => {
    return () => {
      if (event_source != null) {
        event_source.close();
      }
    };
  }, []);

  useEffect(() => {
    console.log("Media Type: ", media_type);
    console.log("Movie ID: ", id);
    find_similar_movies(id);
    get_media_details(id);
    set_torrent_search_select_multiple(media_type == 'tv');
    props.close_torrent_queue();
    window.scrollTo(0, 0);
  }, [media_type, id]);



  const request_download = (torrent_magnet_link, media_type, movie_name) => {
    console.log('Requesting download for: ', torrent_magnet_link, media_type, movie_name);
    set_searching_for_torrents(false);
    event_source.close();
    fetch(`${import.meta.env.VITE_SERVER_URL}/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        magnet: torrent_magnet_link,
        media_type: media_type,
        movie_name: movie_name
      })
    }).then(res => res.json()).then(data => {
      console.log(data);
      set_torrent_added(true);
      set_torrent_list([]);
      event_source.close();
      set_searching_for_torrents(false);
      set_search_source(null);
      window.scrollTo(0, 0);
    }).catch(err => {
      console.log(err);
      set_torrent_error("Error Requesting Torrent Download " + JSON.stringify(err));
    });
  };

  const find_similar_movies = movie_search => {
    switch (media_type) {
      case 'movies':
        // We use the movie_detailsdb api to find similar movies to the selected movie, using the movieRecommendations method
        props.moviedb.movieRecommendations(id).then(res => {
          console.log("Recommended Movies:", res); // scroll the movie details modal body to the top

          movie_details_modal_body.current.scrollTo(0, 0);
          set_torrent_added(false);
          set_torrent_list([]);
          set_torrent_error(null);
          set_searching_for_torrents(false);
          set_recommended_movies(res.results);
        });
        break;
      case 'tv':
        // We use the props.moviedb api to find similar tv shows to the selected tv show, using the tvRecommendations method
        props.moviedb.tvRecommendations(id).then(res => {
          console.log("Recommended TV Shows:", res); // scroll the movie details modal body to the top

          movie_details_modal_body.current.scrollTo(0, 0);
          set_torrent_added(false);
          set_torrent_list([]);
          set_torrent_error(null);
          set_searching_for_torrents(false);
          set_recommended_movies(res.results);
        });
        break;
    }
  };

  const get_media_details = movie_id => {
    switch (media_type) {
      case 'movies':
        // This function calls the props.moviedb api to get additional details about the movie we're currently looking at
        props.moviedb.movieInfo(movie_id).then(res => {
          console.log(res);
          set_movie_details(res);
        }); // Get the cast of the film as well

        props.moviedb.movieCredits(movie_id).then(res => {
          console.log(res);
          set_movie_cast(res);
        }); // Get the movie backdrop images as well

        props.moviedb.movieImages(movie_id).then(res => {
          console.log(res);
          set_movie_backdrops(res.backdrops);
          set_current_backdrop(0); // Pre-load the next image

          let next_backdrop = new Image();
          next_backdrop.src = `https://image.tmdb.org/t/p/original${res.backdrops[1].file_path}`; // Pre-load the previous image

          let previous_backdrop = new Image();
          previous_backdrop.src = `https://image.tmdb.org/t/p/original${res.backdrops[res.backdrops.length - 1].file_path}`;
        });
        break;
      case 'tv':
        // This function calls the props.moviedb api to get additional details about the tv show we're currently looking at
        props.moviedb.tvInfo(movie_id).then(res => {
          console.log(res);
          set_movie_details(res);
        }); // Get the cast of the tv show as well

        props.moviedb.tvCredits(movie_id).then(res => {
          console.log(res);
          set_movie_cast(res);
        }); // Get the tv show backdrop images as well

        props.moviedb.tvImages(movie_id).then(res => {
          console.log(res);
          set_movie_backdrops(res.backdrops);
          set_current_backdrop(0); // Pre-load the next image

          let next_backdrop = new Image();
          if (res.backdrops[1] != undefined) {
            next_backdrop.src = `https://image.tmdb.org/t/p/original${res.backdrops[1].file_path}`; // Pre-load the previous image

          }

          let previous_backdrop = new Image();
          if (res.backdrops[res.backdrops.length - 1] != undefined) {
            previous_backdrop.src = `https://image.tmdb.org/t/p/original${res.backdrops[res.backdrops.length - 1].file_path}`;

          }
        });
        break;
    }

  };

  const generate_crew_list = (crew) => {
    // Here we return how ever many <p> Elements we need
    // Using the crew array, we will try to find the notable crew members, such as the director, writer, and composer, and list them if they exist.
    // Possible crew jobs: "Director", "Directing", "Writing", "Production", "Editing", "Sound", "Camera", "Visual Effects", "Lighting"
    // instead of "job", "it may also be under "known_for_department
    let crew_list = [];
    let director = crew.find(member => member.job == "Director" || member.known_for_department == "Directing");

    if (director != undefined) {
      crew_list.push(<p key={0}>Directed By: {director.name}</p>);
    }

    let writer = crew.find(member => member.job == "Writer" || member.known_for_department == "Writing");

    if (writer != undefined) {
      crew_list.push(<p key={1}>Written By: {writer.name}</p>);
    }

    let composer = crew.find(member => member.job == "Composer");

    if (composer != undefined) {
      crew_list.push(<p key={2}>Music By: {composer.name}</p>);
    }

    return crew_list;
  }

  return (
    <motion.div
      key={location.pathname}
      // Scroll in from top
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, type: "easeInOut" }}
      className="MovieDetailsModal">
      <div className="MovieDetailsModalBackground"
        style={{
          backgroundImage: `url(https://image.tmdb.org/t/p/original${movie_backdrops != null && movie_backdrops[current_backdrop] != undefined ? movie_backdrops[current_backdrop].file_path : ''})`
        }}
        onClick={() => {
          props.navigate('/');
        }}>
        <div className="MovieDetailsModalBackgroundOverlay"></div>

      </div>
      {/* We're going to add a background image only on this page, it will be the first movie_backdrop, blurred */}
      <div className="MovieDetailsModalHeader" onContextMenu={e => {
        e.preventDefault();

        if (movie_backdrops != null) {
          if (current_backdrop == 0) {
            set_current_backdrop(movie_backdrops.length - 1); // Pre-load the previous image

            let previous_backdrop = new Image();
            previous_backdrop.src = `https://image.tmdb.org/t/p/original${movie_backdrops[movie_backdrops.length - 2].file_path}`;
          } else {
            set_current_backdrop(current_backdrop - 1); // Pre-load the previous image

            let previous_backdrop = new Image();
            previous_backdrop.src = `https://image.tmdb.org/t/p/original${movie_backdrops[current_backdrop - 2].file_path}`;
          }
        }
      }} onClick={() => {
        if (movie_backdrops != null) {
          if (current_backdrop == movie_backdrops.length - 1) {
            set_current_backdrop(0);
          } else {
            set_current_backdrop(current_backdrop + 1); // Pre-load the next image

            let next_backdrop = new Image();
            next_backdrop.src = `https://image.tmdb.org/t/p/original${movie_backdrops[current_backdrop + 2].file_path}`;
          }
        }
      }}>
        {/* This Element allows you to mark a movie as owned */}
        {/* If this movie's id is found in the props.owned_movie_list, we show the check image as the child image, if not, we show the add image */}
        {/* On Click, we call props.update_owned_list with the parameter being the current movie's id */}
        <div className="MovieDetailsModalHeaderImage" style={{
          backgroundImage: `url(https://image.tmdb.org/t/p/original${movie_backdrops != null && movie_backdrops[current_backdrop] != undefined ? movie_backdrops[current_backdrop].file_path : ''})`
        }}>
        </div>
        <div className="MovieDetailsModalHeaderContainer">

        </div>
        <h1 className="MovieDetailsModalHeaderTitle">{
          // If the Media Type is a movie, we will display the title of the movie
          // If the Media Type is a TV Show, we will display the name of the TV Show
          media_type == "movies" ? movie_details.title : movie_details.name
        }</h1>
      </div>
      <div className="MovieDetailsModalBody" ref={movie_details_modal_body}>
        {props.owned_movie_list.includes(Number(id)) && <img className='OwnedMovieToggle' src={props.owned_movie_list.includes(Number(id)) ? check : add} alt="Add" onClick={(e) => {
          // Stop propagation so we don't navigate to the movie details page
          e.stopPropagation();
          // console.log("This movie's id is: ", Number(id));
          // console.log("The owned movie list is: ", props.owned_movie_list)
          // console.log("The result of props.owned_movie_list.includes(id) is: ", props.owned_movie_list.includes(Number(id)) ? "true" : "false");
          // props.update_owned_list(id);
        }} />}
        {/* Already in Library text, use the owned_movie_list to set the text */}

        {
          props.owned_movie_list.includes(Number(id)) ?
            <p className="PlexLink"
              onClick={() => {
                window.open(`https://app.plex.tv/desktop/#!/search?pivot=top&query=${media_type == 'tv' ? movie_details.name : movie_details.title}`);
              }}
            >Already In Library! Click To Open In Plex</p> : null}

        {/* We're going to show a rating, which is based on the vote average, a double with a highest possible value of 10 (vote_average), we'll round it to the first decimal place, we'll also show theh vote_count, which is the number of votes this movie has received */}
        <p>Rating: {
          movie_details.vote_average != null ? movie_details.vote_average.toFixed(1) : "N/A"
        }/10 ({movie_details.vote_count != undefined ? movie_details.vote_count.toLocaleString() + " votes" : ""})</p>

        {movie_details != null && movie_details.tagline != "" ? <p>{movie_details.tagline}</p> : null}

        <p>{movie_details.overview}</p>

        <p className="ReleaseDate" ref={release_date_ref}>Released {// First, we figure out if the media_type is tv, if so, use first_air_date, if not, use release_date, then turn it into a pretty date string like "January 1st, 2022"
          new Date(media_type == 'tv' ? movie_details.first_air_date : movie_details.release_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</p>

        {movie_cast != null ? <p>Starring:{" "}
          {movie_cast.cast.slice(0, 5).map((actor, index) => {
            return actor.name;
          }).join(', ')}
        </p> : null}

        {
          // Using the crew array, we will try to find the notable crew members, such as the director, writer, and composer, and list them if they exist.
          // Possible crew jobs: "Director", "Directing", "Writing", "Production", "Editing", "Sound", "Camera", "Visual Effects", "Lighting"
        }

        {
          movie_cast != null ?
            generate_crew_list(movie_cast.crew).map((crew_member, index) => {
              return crew_member;
            }) : null
        }


        {movie_details.genres != null ? <p>{movie_details.genres.map((genre, index) => {
          return genre.name;
        }).join(', ')}</p> : null}

        {movie_details.runtime != null ? <p>{movie_details.runtime} Minutes</p> : null}

        {/* Also display number of seasons */}

        {movie_details.number_of_seasons != null ? <p>{movie_details.number_of_seasons} Seasons</p> : null}

        {/* Add a Divider for aesthetics */}
        <hr />

        {
          /* Now we have a section for similar movies, these will be movie cards and will carousel so the user can see more to the right */
        }
        <hr />
        {recommended_movies.length > 0 && <h2 className="SimilarMoviesText">{media_type == "movies" ? "Similar Movies" : "Similar Shows"}</h2>}
        {recommended_movies.length > 0 && <div className="MovieDetailsModalRecommendedMovies">
          {recommended_movies.map((movie, index) => {
            return <MovieCard owned_movie_list={props.owned_movie_list} update_owned_list={props.update_owned_list} navigate={props.navigate} media_type={media_type} key={index} movie={movie} set_selected_movie={clicked_movie => {
              props.set_selected_movie(clicked_movie);
            }} />;
          })}
        </div>}
      </div>
    </motion.div>
  )
}
export {
  MovieDetailsModal
}