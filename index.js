#!/usr/bin/env node

var fs = require('fs')
var Trello = require("node-trello");
var Spotify = require('node-spotify-api');
var stringSimilarity = require('string-similarity');


var t = new Trello("307361bec06b5f664932282b50fb8f87", "71fc14193997e9bd5f91b9600e87bacae3ab354b0d68e9c181241594ded44526");

var spotify = new Spotify({
  id: "3f7af8827e53456dadff2ca65329097b",
  secret: "38fae628bcc24ed6a6f3638f6a90325d"
});

Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {         
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};

var extractAlbums = function(rawData) {
  var rawLines = rawData.split("\n")
  rawLines.clean('')
  return rawLines.map(function(rawAlbum){
    return {
      year: rawAlbum.substring(0, 4),
      name: rawAlbum.substring(5)
    }
  })
}

var createBoard = function(callback){
  t.post(
    "/1/boards/", 
    { 
      name: "prueba 20",
      defaultLists: false
    },
    function(err, response) {
      if (err) throw err;
        callback(response)
      }
    );  
}

var sortAlbums = function(albums) {

  function comparator(a, b) {
    var yearComp = a.year - b.year;
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
}

var groupByDecade = function(albums) {
  var getDecade = function(album){
    return Math.floor(album.year/10)*10
  }
  
  var decades = {}

  for (let album of albums) {
    var decade = getDecade(album)
    if(Object.is(decades[decade], undefined)) decades[decade] = []
    decades[decade].push(album)
  }

  return decades
}

var fileContents = fs.readFileSync('files/discography.txt').toString();
var albums = extractAlbums(fileContents)
sortAlbums(albums)
var groupedAlbums = groupByDecade(albums)


createBoard(function(boardRespone){
  var boardId = boardRespone.id
  var decades = Object.keys(groupedAlbums)

  let lists = decades.reduce((promiseChain, decade) => {
    return promiseChain.then(() => new Promise((resolve) => {
      createList(decade, boardId, function(listResponse){
        
        var listId = listResponse.id


        //****** ACA VAN LAS CARDS
        let cards = groupedAlbums[decade].reduce((promiseChain, album) => {
          return promiseChain.then(() => new Promise((resolveCard) => {
            var cardName = (album.year + " - " + album.name)
            console.log(`cardName: ${cardName}`)
            getCoverArtUrl(album.name, function(coverArtUrl){
              console.log(`coverArtUrl: ${coverArtUrl}`)
              createCard(cardName, listId, coverArtUrl, function(){
                resolveCard()
              })
            })
          }));
        }, Promise.resolve());
          
        cards.then(() => console.log('done with cards for list'))
        //******

        resolve()
      })
    }));
  }, Promise.resolve());
    
  lists.then(() => console.log('done with Lists'))
})


var createCard = function(name, listId, coverArtUrl, callback){
  var params = { 
      name: name,
      idList: listId,
      pos: 'bottom'      
  }
  if(coverArtUrl){
    params.urlSource = coverArtUrl
  }
  t.post(
    "/1/cards/", 
    params,
    function(err, response) {
      console.log(err)
      console.log(response)
      if (err) throw err;
        callback(response)
      }
    );  
}


var createList = function(name, boardId, callback){
  t.post(
    "/1/lists/", 
    { 
      name: name,
      idBoard: boardId,
      pos: 'bottom'
    },
    function(err, response) {
      if (err) throw err;
        callback(response)
      }
    );  
}

var lookForBestMatch = function(name, albums){
  var bestMatchValue = 0
  var bestMatch
  for(var albumKey in Object.keys(albums)){
    var similarity = stringSimilarity.compareTwoStrings(name, albums[albumKey].name)
    if(similarity > bestMatchValue){
      bestMatchValue = similarity
      bestMatch = albums[albumKey]
    }
  }
  return bestMatch
}
 
var getCoverArtUrl = function(albumName, callback){
  var formattedAlbumName = encodeURI(albumName)//.replace(/ /g,"+")

  console.log(formattedAlbumName)
  spotify.search({ type: 'album', query: `artist:Bob+Dylan album:${formattedAlbumName}` }, function(err, data) {
    if(data && data.albums.items.length == 0){
      return callback(null)
    }
    if (err) {
      return console.log('Error occurred: ' + err);
    }
    var selectedAlbum = lookForBestMatch(albumName, data.albums.items)
    return callback(selectedAlbum.images[0].url)
  });
}

// getCoverArtUrl("Bob Dylan", function(){})