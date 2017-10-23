import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

import { Rooms, Players } from '../api/collections.js';

import './body.html';

import './newgame.js';
import './joingame.js';
import './lobby.js';
import './table.js';
import './game.js';
import './gameover.js';

// demo
import './demonew.js';
import './demolobby.js';
import './demotable.js';
import './demogame.js';

Tracker.autorun(function roomState() {
  if (!Session.get("view")) {
    Session.set("view", "startmenu");
  };

  let roomId = Session.get("roomId");
  let playerId = Session.get("playerId");

  if (!roomId || !playerId) {
    // console.log("no roomId or playerId...returning now");
    return;
  };

  let room = Rooms.findOne(roomId);
  let player = Players.findOne(playerId);
  // testing
  // console.log("room", room);
  // console.log("player", player);
  window.player = player;
  window.room = room;

  if (!room || !player) {
    Session.set("roomId", null);
    Session.set("playerId", null);
    Session.set("view", "startmenu");
    return;
  }

  Session.set("view", {
    "lobby": "lobby",
    "table": "table",
    "game": "game",
    "gameover": "gameover",
    "demonew": "demonew",
    "demolobby": "demolobby",
    "demotable": "demotable",
    "demogame": "demogame"
  }[room.state] || null);
  // after room.state is defined for the first time. aka new game server side
  // you cant used button menu to navigate away. you stuck
});

// update url to room's url
function hasHistoryAPI() {
  return !!(window.history && window.history.pushState);
};

if (hasHistoryAPI()) {
  function urlState() {
    // debugger
    // still need to check if this works, on re-entrance and navigating to new room
    let accessCode = null;
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    if (room) {
      accessCode = room.accessCode;
    } else {
      accessCode = Session.get("accessCode");
    }
    let currentURL = '/';
    if (accessCode) {
      currentURL += accessCode + '/';
    }
    window.history.pushState(null, null, currentURL);
  }
  Tracker.autorun(urlState);
}

Template.main.helpers({
  currentview: function() {
    return Session.get("view");
  }
});

Template.startmenu.events({
  "click .newgame-button": function() {
    Session.set("view", "newgame");
    // console.log("new game");
  },
  "click .joingame-button": function() {
    Session.set("view", "joingame");
    // console.log("join game");
  },
  "click .demo-button": function() {
    Session.set("view", "demonew");
  },
})

Template.buttonmenu.events({
  "click .newgame-button": function() {
    document.getElementById('test-btn').disabled = true;
    Session.set("view", "newgame");
    console.log("trying to start a new game");
  },
  "click .joingame-button": function() {
    Session.set("view", "joingame");
    console.log("attempting to join game");
  },
  "click .startmenu-button": function() {
    Session.set("view", "startmenu");
    console.log("view changed to startmenu");
  },
  "click .lobby-button": function() {
    Session.set("view", "lobby");
    console.log("view changed to lobby");
  },
  "click .table-button": function() {
    document.getElementById('test-btn').disabled = false;
    Session.set("view", "table");
    console.log("view changed to table");
  },
  "click .game-button": function() {
    Session.set("view", "game");
    console.log("view changed to game view");
  },
  "click .gameover-button": function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    if (!room) {
      Session.set("view", "gameover");
    } else {
      Rooms.update(roomId, { state: "gameover"} );
    }
    console.log("view changed to gameover");
  },
  "click .session-button": function() {
    console.log(Session.keys);
  },
});

Template.loadroom.events({
  // rewrite this to send updates to the db to rewrite test players
  // find current roomId, then update test players into current Room
  // populate room

  "click .populate-button": function(event) {
    event.preventDefault();

    let currentRoomId = Session.get("roomId");
    let testPlayers = [
      ["101", "Jovian", "sushi"],
      ["102", "Estaban", "sushi"],
      ["103", "Sebastian", "sushi"],
      ["104", "Yoda", "sushi"]
    ];
    testPlayers.forEach(function(player) {
      Players.upsert(
        { _id: player[0]},
        { name: player[1], roomId: currentRoomId, codename: player[2] }
      );
    });
  },
  "click .sit-button": function(event) {
    event.preventDefault();

    let currentRoomId = Session.get("roomId");

    let testPlayers = [
      ["101", "Jovian", "sushi"],
      ["102", "Estaban", "sushi"],
      ["103", "Sebastian", "sushi"],
      ["104", "Yoda", "sushi"]
    ];

    testPlayers.forEach(function(player) {
      Meteor.call("ready", {
        playerId: player[0],
        demo: false
      }, (err) => {
        if (err) {
          console.error(err);
        }
      });
    })
  },
})
