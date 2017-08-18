import { Template } from 'meteor/templating';

import { Rooms, Players } from '../api/collections.js';
import { PRESIDENTIALPOWERS } from './utils.js';

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
    if (room.currentChancellor == -1) {
      console.log("president choosing next chancellor");
      // return;
    }
    return room.players[room.currentChancellor].playerId == playerId;
  },
  picking: function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    return room.currentChancellor == -1 && room.executiveaction == "inactive";
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
  partymembership: function(player) {
    if (player.role == "liberal") {
      return "liberal";
    } else {
      return "fascist";
    }
  },
  playercircle: function(playerId) {
    let currentPlayerId = Session.get("playerId");
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    if (room.players[room.currentPresident].playerId == playerId) {
      return "president";
    } else if (_.contains(room.deathtags, playerId)) {
      return "dead";
    } else if (room.players[room.currentPresident].playerId == currentPlayerId && room.specialelection) {
      return "president-candidate";
    } else if (room.players[room.currentPresident].playerId == currentPlayerId && room.assassination) {
      return "on-the-chopping-board";
    } else if (room.players[room.currentPresident].playerId == currentPlayerId && room.currentChancellor == -1 && !_.contains(room.ruledout, playerId)) {
      return "chancellor-candidate";
    } else if (room.currentChancellor > -1 && room.players[room.currentChancellor].playerId == playerId) {
      return "chancellor";
    }
  },
  powers: function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    let numOfPlayers = room.players.length;
    if (numOfPlayers < 5) {
      return [ PRESIDENTIALPOWERS[1], PRESIDENTIALPOWERS[2], PRESIDENTIALPOWERS[3], PRESIDENTIALPOWERS[4], PRESIDENTIALPOWERS[5], PRESIDENTIALPOWERS[6] ];
    } else if (numOfPlayers < 7) { // 5 and 6
      return [ PRESIDENTIALPOWERS[1], PRESIDENTIALPOWERS[2], PRESIDENTIALPOWERS[6] ];
    } else { // 7, 8, 9 and 10
      return [ PRESIDENTIALPOWERS[3], PRESIDENTIALPOWERS[4], PRESIDENTIALPOWERS[2], PRESIDENTIALPOWERS[6] ];
    }
  },
  executiveaction: function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    return room.executiveaction == "active";
  },
  presidentvetobutton: function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    return room.vetobutton.president;
  },
  chancellorvetobutton: function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    return room.vetobutton.chancellor;
  },
  vetopassed: function(officialId) {
    debugger
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    let official = "";
    if (officialId == 1) {
      official = "president";
    } else if (officialId == 2) {
      official = "chancellor";
    }
    return room.vetoresult[official] == "pass";
  },
  vetofailed: function(officialId) {
    debugger
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    let official = "";
    if (officialId == 1) {
      official = "president";
    } else if (officialId == 2) {
      official = "chancellor";
    }
    return room.vetoresult[official] == "fail";
  },
  dead: function() {
    let playerId = Session.get("playerId");
    let player = Players.findOne(playerId)
    let roomId = Session.get("roomId")
    let room = Rooms.findOne(roomId);
    return _.contains(room.deathtags, playerId);
  },
  newlydeceased: function() {
    let playerId = Session.get("playerId");
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    return room.dead[0]._id == playerId;
  },
  gravestonename: function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    let name = room.dead[0].name;
    return name;
  }
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
    Meteor.call("continue", {
      playerId: playerId,
      type: "fail"
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
      if (room.currentChancellor == -1 && !room.specialelection) {
        Meteor.call("pickchancellor", {
          playerId: playerId
        });
      }
      if (room.specialelection) {
        let nextPresident = Players.findOne(playerId);
        Meteor.call("specialelection", {
          nextPresident: nextPresident,
          currentPlayerId: currentPlayerId
        });
      }
      if (room.assassination) {
        let deceased = Players.findOne(playerId);
        debugger
        Meteor.call("assassination", { deceased: deceased });
      }
    }
  },
  "click .powers-button": function() {
    document.getElementById("dropdown-menu").classList.toggle("show");
  },
  "click .power-name": function() {
    let powerId = $(event.target).data("powerid");
    console.log(`click ${powerId}`);
    document.getElementById(`power-description-${powerId}`).classList.toggle("show");
  },
  "click .peek-continue-button": function() {
    let playerId = Session.get("playerId");
    console.log("click peek continue");
    Meteor.call("continue", { playerId: playerId, type: "peek" });
  },
  "click .suspect": function() {
    let suspectId = $(event.target).data("suspectid");
    console.log(`suspect ${suspectId}`);
    Meteor.call("investigate", { suspectId: suspectId });
  },
  "click .investigate-continue-button": function() {
    let playerId = Session.get("playerId");
    console.log("click investigate continue");
    Meteor.call("continue", { playerId: playerId, type: "investigate" });
  },
  "click .veto-button": function() {
    debugger
    let playerId = Session.get("playerId");
    let official = $(event.target).data("veto");
    Meteor.call("veto", { playerId: playerId, official: official });
  },
  "click .yes-veto": function() {
    let playerId = Session.get("playerId");
    let official = $(event.target).data("veto");
    Meteor.call("veto-vote", {
      playerId: playerId,
      official: official,
      vote: true
    });
  },
  "click .no-veto": function() {
    let playerId = Session.get("playerId");
    let official = $(event.target).data("veto");
    Meteor.call("veto-vote", {
      playerId: playerId,
      official: official,
      vote: false
    });
  },
  "click .president-veto-continue": function() {
    let roomId = Session.get("roomId");
    Meteor.call("president-veto-continue", {
      roomId: roomId
    });
    console.log("president veto approved!");
  },
  "click .chancellor-veto-continue": function() {
    let roomId = Session.get("roomId");
    console.log("chancellor veto approved!");
    Meteor.call("chancellor-veto-continue", {
      roomId: roomId
    });
  },
  "click .execution-continue-button": function() {
    let playerId = Session.get("playerId");
    console.log("Someone assassinated. But the Game continues");
    Meteor.call("continue", { playerId: playerId, type: "execution" });
  },
})
