#!/usr/bin/env node


/*
 * Require needed modules.
 */
const fs = require('fs')
const trelloProxy = require('./src/trello_proxy')
const spotifyProxy = require('./src/spotify_proxy')

require("./extensions/array_clean")


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


trelloProxy.createBoard("tabla 111", function(boardRespone){
  var boardId = boardRespone.id
  var decades = Object.keys(groupedAlbums)

  let lists = decades.reduce((promiseChain, decade) => {
    return promiseChain.then(() => new Promise((resolve) => {
      trelloProxy.createList(decade, boardId, function(listResponse){
        
        var listId = listResponse.id


        //****** ACA VAN LAS CARDS
        let cards = groupedAlbums[decade].reduce((promiseChain, album) => {
          return promiseChain.then(() => new Promise((resolveCard) => {
            var cardName = (album.year + " - " + album.name)
            console.log(`cardName: ${cardName}`)
            spotifyProxy.getCoverArtUrl(album.name, function(coverArtUrl){
              console.log(`coverArtUrl: ${coverArtUrl}`)
              trelloProxy.createCard(cardName, listId, coverArtUrl, function(){
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