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
const BOARD_NAME = "TABLA 45454SP"
trelloProxy.createBoard(BOARD_NAME, function(boardRespone){
  createLists(boardRespone.id, Object.keys(groupedAlbums))
})





const createLists = function(boardId, decades){
  const lists = decades.reduce((promiseChain, decade) => {
    return promiseChain.then(() => new Promise((resolve) => {
      trelloProxy.createList(decade, boardId, function(listResponse){
        createCards(listResponse.id, decade)
        resolve()
      })
    }));
  }, Promise.resolve());
    
  lists.then(() => console.log('All lists have been created'))
}

const createCards = function(listId, decade){
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
    
  cards.then(() => console.log('All cards have been created'))
}
