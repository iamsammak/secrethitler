import { Template } from 'meteor/templating';

import { Rooms, Players } from '../api/collections.js';

import './seating.html';

Template.seating.events({
  "click #ready-button": function() {
    Meteor.call("ready", {
      playerId: playerId
    }, (err) => {
      if (err) {
        console.error(err);
      }
    });
  }
});

Template.seating.helpers({
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
      return room.fascist;
    }
  },
});
