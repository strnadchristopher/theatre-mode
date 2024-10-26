import { motion } from 'framer-motion';
import { Tilt } from 'react-tilt'
import add from '../assets/add.png';
import check from '../assets/check.png';

export function MovieCard(props) {
  const rating_to_string = (rating) => {
    // We will convert the rating number, which is a number with decimals, with a maximum of ten
    // We'll convert numbers to a value as decided by this array
    const ratings = ["Unrated",
      "Dogshit", // 1
      "Retarded", // 2
      "Ass", // 3
      "Not Good", // 4  
      "Bad", // 5
      "Okay", // 6
      "Great", // 7
      "Excellent",  // 8
      "Masterwork", // 9
      "God-Level"]; // 10
    // We'll get the index of the rating, and return the string at that index
    return ratings[Math.floor(rating)] + " (" + Math.floor(rating * 10) + "%)";
  }
  return (// IF props.movie.poster_path is undefined, we will center the title veritcally and horizontally
    // Give the moviecard a css variable which is the background image url of the poster_path

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
      className="MovieCardTilt"
      >
      <motion.div
        // initial={{ opacity: 0, transform: "scale(0)" }}
        // whileInView={{ opacity: 1, transform: "scale(1)"}}
        // viewport={{ once: true }}
        // // On Hover, scale the movie card to 1.1
        // whileHover={{ transform: "scale(1.05)"}}
        className="MovieCard" onClick={() => {
          props.navigate(`/${props.media_type}/details/${props.movie.id}`)
        }} style={{
          backgroundImage: props.movie.poster_path == undefined ? 'none' : `url(https://image.tmdb.org/t/p/w780${props.movie.poster_path})`
        }}>
        <div className="MovieCardTopGradient">

        </div>

        {/* We display it's vote average, which is a number with decimals we'll turn into a percent */}
        <span className="MovieCardVoteAverage">{

          props.movie.vote_average != undefined ?
            rating_to_string(props.movie.vote_average) : "N/A"
        }</span>

        {/* We use props.owned_movie_list, which is an array of movie id's, if this movie's id is in that list, it's considered owned */}
        {props.owned_movie_list != undefined && <img
          className='MovieCardOwnedToggleImage'
          onClick={(e) => {
            e.stopPropagation();
            props.update_owned_list(props.movie.id);
          }}
          src={
            props.owned_movie_list.includes(props.movie.id) ? check : add}
          alt="Check" />
        }
        <h1 className={props.movie.poster_path == undefined ? "MovieTitle Centered" : "MovieTitle"}>{
          // If the Media Type is a movie, we will display the title of the movie
          // If the Media Type is a TV Show, we will display the name of the TV Show
          props.media_type == "movies" ? props.movie.title : props.movie.name
        }</h1>
      </motion.div>
    </Tilt>
  );
}
