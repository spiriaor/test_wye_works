#!/usr/bin/env node


/*
 * Require needed modules.
 */
const fs = require('fs')
const Trello = require("node-trello");
const spotifyProxy = require('./src/spotify_proxy')

require("./extensions/array_clean")

/*
 * Constants used when conecting to trello and spotify api.
 */
const TRELLO_CLIENT_ID = "307361bec06b5f664932282b50fb8f87"
const TRELLO_CLIENT_SECRET = "71fc14193997e9bd5f91b9600e87bacae3ab354b0d68e9c181241594ded44526"

/*
 * Initialize Trello
 */
const t = new Trello(TRELLO_CLIENT_ID, TRELLO_CLIENT_SECRET)

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
      name: "prueba 91",
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
            spotifyProxy.getCoverArtUrl(album.name, function(coverArtUrl){
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