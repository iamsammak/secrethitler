// import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Rooms, Players } from '../api/collections.js';

import './lobby.html';

Template.lobby.onRendered(function() {
  // change url on entrance TODO this doesn't work yet
  let roomId = Session.get("roomId");
  let room = Rooms.findOne(roomId);
  let accessCode = room.accessCode;
  Session.set("accessCode", accessCode);
});

Template.lobby.helpers({
  cantRemoveOwner: function(a) {
    return a != room.owner;
  },
  players: function() {
    let playerId = Session.get("playerId");
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    if (!room) {
      return null;
    }
    return Players.find({ roomId: roomId }).fetch().map(
      function(player) {
        // console.log(player);
        // Explanation: set player.current to be player._id if player._id is equal to playerId
        player.current = player._id == playerId;
        return player;
      });
  },
  room: function() {
    let roomId;
    if (roomId = Session.get("roomId")) {
      return Rooms.findOne(roomId);
    }
  },
  owner: function() {
    let playerId = Session.get("playerId");
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);

    return playerId === room.owner;
  },
  ready: function(players) {

    let attributes = {};
    if (players.length < 3) { //TODO change back to players.length < 5
      attributes["disabled"] = true;
    } else {
      attributes["disabled"] = false;
    }
    return attributes;
  },
});

Template.lobby.events({
  "click .remove-button": function(event) {
    // console.log("click remove");

    let playerId = $(event.currentTarget).data("playerid");
    Meteor.call("leavegame", { playerId: playerId });
  },
  "click .start-button": function() {
    let roomId = Session.get("roomId");
    Meteor.call("startgame", { roomId: roomId });
  },
  "click .quit-button": function() {
    let playerId = Session.get("playerId");
    Meteor.call("leavegame", { playerId: playerId }, (err) => {
      if (err) {
        console.error(err);
      }
      Session.set("roomId", null);
      Session.set("playerId", null);
      Session.set("view", "startmenu");
    });
  },
  "click .button-color-key": function() {
    document.getElementById("color-key").classList.toggle("show");
  },
  "click .btn-win-condition": function() {
    document.getElementById("win-condition").classList.toggle("show");
  },
});
