#!/usr/bin/env node


/*
 * Require needed modules.
 */
const fs = require('fs')
const trelloProxy = require('./src/trello_proxy')
const spotifyProxy = require('./src/spotify_proxy')
const dataProcessor = require('./src/data_processor')


/*
 * Read file and prepare data.
 */
const fileContents = fs.readFileSync('files/discography.txt').toString();
const albums = dataProcessor.extractAlbums(fileContents)
dataProcessor.sortAlbums(albums)
const groupedAlbums = dataProcessor.groupByDecade(albums)

/*
 * Create trello board
 */
trelloProxy.createBoard("tabla 233", function(boardRespone){
  const boardId = boardRespone.id
  const decades = Object.keys(groupedAlbums)

  const lists = decades.reduce((promiseChain, decade) => {
    return promiseChain.then(() => new Promise((resolve) => {
      trelloProxy.createList(decade, boardId, function(listResponse){
        
        let listId = listResponse.id

        let cards = groupedAlbums[decade].reduce((promiseChain, album) => {
          return promiseChain.then(() => new Promise((resolveCard) => {
            let cardName = (album.year + " - " + album.name)
            spotifyProxy.getCoverArtUrl(album.name, function(coverArtUrl){
              trelloProxy.createCard(cardName, listId, coverArtUrl, function(){
                resolveCard()
              })
            })
          }));
        }, Promise.resolve());
          
        cards.then(() => console.log('done with cards for list'))

        resolve()
      })
    }));
  }, Promise.resolve());
    
  lists.then(() => console.log('done with Lists'))
})