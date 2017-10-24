const Spotify = require('node-spotify-api');
const stringSimilarity = require('string-similarity');

const SPOTIFY_ID = "3f7af8827e53456dadff2ca65329097b"
const SPOTIFY_SECRET = "38fae628bcc24ed6a6f3638f6a90325d"

const ARTIST = "Bob+Dylan"

/*
 * Initialize Spotify
 */
const spotify = new Spotify({
  id: SPOTIFY_ID,
  secret: SPOTIFY_SECRET
});

/*
 * Spotify returns every album that matches with the query so this method gets the one that matches the most
 */
const lookForBestMatch = function(name, albums){
  let bestMatchValue = 0
  let bestMatch
  for(let albumKey in Object.keys(albums)){
    let similarity = stringSimilarity.compareTwoStrings(name, albums[albumKey].name)
    if(similarity > bestMatchValue){
      bestMatchValue = similarity
      bestMatch = albums[albumKey]
    }
  }
  return bestMatch
}

module.exports = {
  
  /*
   * Gets the url of the cover art image for the album and passes it as the first parameter to callback.
   */
  getCoverArtUrl: function(albumName, callback){
    const formattedAlbumName = encodeURI(albumName)

    spotify.search({ type: 'album', query: `artist:${ARTIST} album:${formattedAlbumName}` }, function(err, data) {
      if(data && data.albums.items.length == 0){
        return callback(null)
      }
      if (err) {
        return console.log('Error occurred: ' + err);
      }
      const selectedAlbum = lookForBestMatch(albumName, data.albums.items)
      return callback(selectedAlbum.images[0].url)
    });
  }
}