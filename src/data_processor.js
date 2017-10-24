require("../extensions/array_clean")

const TXT_YEAR_NAME_SEPARATOR_POSITION = 4

module.exports = {

  /*
   * Takes raw data read from the file and extracts an album object from each line. Returns array of album objects.
   */
  extractAlbums: function(rawData) {
    const rawLines = rawData.split("\n")
    rawLines.clean('')
    return rawLines.map(function(rawAlbum){
      return {
        year: rawAlbum.substring(0, TXT_YEAR_NAME_SEPARATOR_POSITION),
        name: rawAlbum.substring(TXT_YEAR_NAME_SEPARATOR_POSITION+1)
      }
    })
  },


  /*
   * Sorts the array of albums. First by year and then by name.
   */
  sortAlbums: function(albums) {

    function comparator(a, b) {
      const yearComp = a.year - b.year;
      if (yearComp !== 0) {
          return yearComp;
      }

      if (a.name < b.name)
        return -1;
      if (a.name > b.name)
        return 1;
      return 0;
    }

    albums.sort(comparator);
  },

  /*
   * Groups the albums by decades. Returns an object that contains arrays with the albums for each decade.
   */
  groupByDecade: function(albums) {
    const getDecade = function(album){
      return Math.floor(album.year/10)*10
    }
    
    const decades = {}

    for (let album of albums) {
      let decade = getDecade(album)
      if(Object.is(decades[decade], undefined)) decades[decade] = []
      decades[decade].push(album)
    }

    return decades
  }
}