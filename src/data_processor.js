require("../extensions/array_clean")

const TXT_YEAR_NAME_SEPARATOR_POSITION = 4

module.exports = {

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