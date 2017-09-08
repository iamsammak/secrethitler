// import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Rooms, Players } from '../api/collections.js';
import { ROLECARDS } from './utils.js';

import './table.html';

Template.table.events({
  "click #ready-button": function() {
    // console.log("clicked seat me");
    let currentPlayerId = Session.get("playerId");
    // console.log("currentPlayerId", currentPlayerId);
    Meteor.call("ready", {
      playerId: currentPlayerId
    }, (err) => {
      if (err) {
        console.error(err);
      }
    });
  },
  "click .toggle-role": function() {
    document.getElementById("hidden-info").classList.toggle("show");
    // console.log("toggle role");
  },
});

Template.table.helpers({
  equals: function(a, b) {
    return a == b;
  },
  player: function() {
    let playerId = Session.get("playerId");
    let player = Players.findOne(playerId);
    return player;
  },
  isready: function() {
    let attributes = {};
    let playerId = Session.get("playerId");
    let player = Players.findOne(playerId);
    let room = Rooms.findOne(player.roomId);

    if (room.players.filter(function(player) {
      return player.playerId == playerId;
    }).length > 0) {
      attributes["disabled"] = true;
    }

    return attributes;
  },
  role: function() {
    let playerId = Session.get("playerId");
    let player = Players.findOne(playerId);
    return player.role;
  },
  players: function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    // console.log("current in the room", room.players);
    return room.players;
  },
  teammates: function() {
    let playerId = Session.get("playerId");
    let player = Players.findOne(playerId);
    let room = Rooms.findOne(roomId);
    if (player.role == "liberal") {
      return false;
    } else if (player.role == "hitler" && (room.size >= 7 && room.size <= 10)) {
      return false;
    } else {
      return room.teamfascists;
    }
  },
  rolecards: function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    let numOfPlayers = Players.find({ roomId: roomId }).fetch().length;
    return ROLECARDS[numOfPlayers];
  },
});
