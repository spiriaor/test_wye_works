#!/usr/bin/env node

var fs = require('fs')
var program = require('commander');
var Trello = require("node-trello");

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

// program
//   .arguments('<file>')
//   .option('-u, --username <username>', 'The user to authenticate as')
//   .option('-p, --password <password>', 'The user\'s password')
//   .action(function(file) {
//     console.log('user: %s pass: %s file: %s',
//       program.username, program.password, file);
//   })
// .parse(process.argv);

var t = new Trello("307361bec06b5f664932282b50fb8f87", "71fc14193997e9bd5f91b9600e87bacae3ab354b0d68e9c181241594ded44526");

var createBoard = function(callback){
  t.post(
    "/1/boards/", 
    { 
      name: "prueba 8",
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






var fileContents = fs.readFileSync('discography.txt').toString();
var albums = extractAlbums(fileContents)
sortAlbums(albums)
var groupedAlbums = groupByDecade(albums)


createBoard(function(response){
  var boardId = response.id
  var decades = Object.keys(groupedAlbums)


  let lists = decades.reduce((promiseChain, decade) => {
    return promiseChain.then(() => new Promise((resolve) => {
      createList(decade, boardId, function(){
        console.log(response)
        var cardId = response.id

        //****** ACA VAN LAS CARDS
        let cards = groupedAlbums[decade].reduce((promiseChain, album) => {
          return promiseChain.then(() => new Promise((resolveCard) => {
            var cardName = (album.year + " - " + album.name)
            createCard(cardName, cardId, function(){
              resolveCard()
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


var createCard = function(name, listId, callback){
  t.post(
    "/1/cards/", 
    { 
      name: name,
      idList: listId,
      pos: 'bottom'
    },
    function(err, response) {
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