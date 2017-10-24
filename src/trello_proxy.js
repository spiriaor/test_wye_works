const Trello = require("node-trello");

const TRELLO_CLIENT_ID = "307361bec06b5f664932282b50fb8f87"
const TRELLO_CLIENT_SECRET = "71fc14193997e9bd5f91b9600e87bacae3ab354b0d68e9c181241594ded44526"

/*
 * Initialize Trello
 */
const t = new Trello(TRELLO_CLIENT_ID, TRELLO_CLIENT_SECRET)

module.exports = {

  /*
   * Creates a board and calls callback with the response as first parameter
   */
  createBoard: function(name, callback){
    t.post(
      "/1/boards/", 
      { 
        name: name,
        defaultLists: false
      },
      function(err, response) {
        if (err) throw err;
        callback(response)
      }
    );  
  },
  
  /*
   * Creates a card and calls callback with the response as first parameter
   */
  createCard: function(name, listId, coverArtUrl, callback){
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
        if (err) throw err;
        callback(response)
      }
    );  
  },

  /*
   * Creates a list and calls callback with the response as first parameter
   */
  createList: function(name, boardId, callback){
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
}