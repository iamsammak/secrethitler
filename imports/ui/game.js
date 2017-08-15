import { Template } from 'meteor/templating';

import { Rooms, Players } from '../api/collections.js';

import './game.html';

Template.game.helpers({
  equals: function(a, b) {
    return a == b;
  },
  round: function() {
    let room = Rooms.findOne(roomId);
    return room.round;
  },
  room: function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    return room;
  },
  players: function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    return room.players;
  },
  president: function() {
    let playerId = Session.get("playerId");
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    return room.players[room.currentPresident].playerId == playerId;
  },
  chancellor: function() {
    let playerId = Session.get("playerId");
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    return room.players[room.currentChancellor].playerId == playerId;
  },
  picking: function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    return room.currentChancellor == -1;
  },
  voting: function() {
    let playerId = Session.get("playerId");
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    return room.currentPresident > -1 && room.currentChancellor > -1 && !room.voted;
  },
  haventvoted: function() {
    let playerId = Session.get("playerId");
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    return !(playerId in room.votes);
  },
  votecount: function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    return _.size(room.votes);
  },
  votesleft: function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    return _.size(room.players) - _.size(room.votes);
  },
  votepassed: function() {
      var roomId = Session.get("roomId");
      var room = Rooms.findOne(roomId);
      return room.voteresult == "pass";
  },
  votefailed: function() {
      var roomId = Session.get("roomId");
      var room = Rooms.findOne(roomId);
      return room.voteresult == "fail";
  },
  peopleOrperson: function(num) {
    if (num > 1) {
      return "people";
    } else {
      return "person";
    }
  },
  playercircle: function(playerId) {
    currentPlayerId = Session.get("playerId");
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    if (room.players[room.currentPresident].playerId == playerId) {
      return "president";
    } else if (room.players[room.currentPresident].playerId == currentPlayerId && room.currentChancellor == -1 && !_.contains(room.ruledout, playerId)) {
      return "chancellor-candidate";
    } else if (room.currentChancellor > -1 && room.players[room.currentChancellor].playerId == playerId) {
      return "chancellor";
    }
  },
})

Template.game.events({
  "click .yesvote-button": function() {
    let playerId = Session.get("playerId");
    Meteor.call("vote", {
      playerId: playerId,
      vote: true
    });
  },
  "click .fail-continue-button": function() {
    let playerId = Session.get("playerId");
    Meteor.call("failcontinue", {
      playerId: playerId,
      vote: false
    });
  },
  "click .novote-button": function() {
    let playerId = Session.get("playerId");
    Meteor.call("vote", {
      playerId: playerId,
      vote: false
    });
  },
  "click .pick-fascist": function() {
    let playerId = Session.get("playerId");
    Meteor.call("discard", {
        playerId: playerId,
        card: "fascist"
    });
  },
  "click .pick-liberal": function() {
    let playerId = Session.get("playerId");
    Meteor.call("discard", {
        playerId: playerId,
        card: "liberal"
    });
  },
  "click ul.ring > li": function(event) {
    let playerId = $(event.currentTarget).data("playerid");
    let currentPlayerId = Session.get("playerId");
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    if (room.players[room.currentPresident].playerId == currentPlayerId) {
      if (room.currentChancellor == -1) {
        Meteor.call("pickchancellor", {
          playerId: playerId
        });
      }
    }
  },
})
