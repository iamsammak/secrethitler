// import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Rooms, Players } from '../api/collections.js';
import { ROLECARDS } from './utils.js';

import './demotable.html';

Template.demotable.events({
  "click #ready-button": function() {
    // console.log("clicked seat me");
    let currentPlayerId = Session.get("playerId");
    // console.log("currentPlayerId", currentPlayerId);
    Meteor.call("ready", {
      playerId: currentPlayerId,
      demo: true
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
  "click .sit-button": function(event) {
    event.preventDefault();

    document.getElementById("demo-sit").disabled = true;

    let currentRoomId = Session.get("roomId");
    let playerId = Session.get("playerId");
    let room = Rooms.findOne(currentRoomId);
    let testPlayers = [
      [`101${playerId}`, "P1", "sushi", 0],
      [`102${playerId}`, "P2", "sushi", 1],
      [`103${playerId}`, "P3", "sushi", 2],
      [`104${playerId}`, "P4", "sushi", 3]
    ];
    testPlayers.forEach(function(player) {
      room.players.push({
        playerId: player[0],
        name: player[1],
        role: player[2]
      });

      let update = { players: room.players };

      Rooms.upsert({ _id: currentRoomId }, {
        $set: update
      });
    });
  }
});

Template.demotable.helpers({
  equals: function(a, b) {
    return a == b;
  },
  player: function() {
    let playerId = Session.get("playerId");
    let player = Players.findOne(playerId);
    return player;
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
  isready: function(players) {
    // console.log(players);
    let attributes = {};
    let playerId = Session.get("playerId");
    let player = Players.findOne(playerId);
    let room = Rooms.findOne(player.roomId);

    if (room.players.filter(function(player) {
      return player.playerId == playerId;
    }).length > 0) {
      attributes["disabled"] = true;
    }

    if (players.length < 1) {
      attributes["disabled"] = true;
    } else {
      attributes["disabled"] = false;
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
