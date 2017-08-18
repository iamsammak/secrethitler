import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

import { Rooms, Players } from '../api/collections.js';

import './body.html';

import './newgame.js';
import './joingame.js';
import './lobby.js';
import './seating.js';
import './game.js';
import './gameover.js';

// testing files
import './dynamic-test.js';
import './hello-info.js';

Tracker.autorun(function roomstate() {
  if (!Session.get("view")) {
    Session.set("view", "startmenu");
  };
  console.log("hello inside Tracker");

  let roomId = Session.get("roomId");
  let playerId = Session.get("playerId");

  if (!roomId || !playerId) {
    console.log("no roomId or playerId...returning now");
    return;
  };

  let room = Rooms.findOne(roomId);
  let player = Players.findOne(playerId);
  // testing
  console.log("room", room);
  window.room = room
  console.log("player", player);

  if (!room || !player) {
    Session.set("roomId", null);
    Session.set("playerId", null);
    Session.set("view", "startmenu");
    return;
  }

  Session.set("view", {
    "lobby": "lobby",
    "seating": "seating",
    "game": "game",
    "gameover": "gameover"
  }[room.state] || null);
  // after room.state is defined for the first time. aka new game server side
  // you cant used button menu to navigate away. you stuck
});

Template.main.helpers({
  currentview: function() {
    return Session.get("view");
  }
});

Template.startmenu.events({
  "click .newgame-button": function() {
    Session.set("view", "newgame");
    console.log("new game");
  },
  "click .joingame-button": function() {
    Session.set("view", "joingame");
    console.log("join game");
  },
})

Template.buttonmenu.events({
  "click .newgame-button": function() {
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
  "click .seating-button": function() {
    Session.set("view", "seating");
    console.log("view changed to seating");
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
  "click .loadroom-button": function(event) {
    event.preventDefault();

    let currentRoomId = Session.get("roomId");
    let testPlayers = [
      ["101", "Sam"],
      ["102", "Jeremy"],
      ["103", "Roger"],
      ["104", "Jovian"]
    ];
    testPlayers.forEach(function(player) {
      Players.upsert(
        { _id: player[0]},
        { name: player[1], roomId: currentRoomId }
      );
    });
  },
})
