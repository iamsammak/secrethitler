// import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Rooms, Players } from '../api/collections.js';
import { PRESIDENTIALPOWERS, FASCISTICONS } from './utils.js';

import './demogame.html';

Template.demogame.onRendered(function() {
  // update fills for election tracker, game board
  let roomId = Session.get("roomId");
  let room = Rooms.findOne(roomId);

  for (let i = 1; i <= room.liberal; i++) {
    document.getElementById(`liberal-${i}`).classList.add("fill");
  }
  for (let j = 1; j <= room.fascist; j++) {
    document.getElementById(`fascist-${j}`).classList.add("fill");
  }
  for (let k = 1; k <= room.electiontracker; k++) {
    document.getElementById(`tracker-${k}`).classList.add("fill");
  }
});

Template.demogame.onCreated(function() {
});

Template.demogame.helpers({
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
  owner: function() {
    let playerId = Session.get("playerId");
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);

    return playerId === room.owner;
  },
  players: function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    return room.players;
  },
  role: function() {
    let playerId = Session.get("playerId");
    let player = Players.findOne(playerId);
    return player.role;
  },
  president: function() {
    let playerId = Session.get("playerId");
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    return room.players[room.currentPresident].playerId == playerId;
  },
  presidentname: function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    let name = room.players[room.currentPresident].name;
    return name;
  },
  chancellor: function() {
    let playerId = Session.get("playerId");
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    if (room.currentChancellor == -1) {
      // console.log("president choosing next chancellor");
      return; //null check
    }
    return room.players[room.currentChancellor].playerId == playerId;
  },
  chancellorname: function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    let name = room.players[room.currentChancellor].name;
    return name;
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
    return (!(playerId in room.votes));
  },
  votecount: function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    return _.size(room.votes);
  },
  votesleft: function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    return room.alive - _.size(room.votes);
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
      return [ PRESIDENTIALPOWERS[2], PRESIDENTIALPOWERS[4], PRESIDENTIALPOWERS[5], PRESIDENTIALPOWERS[6] ];
    } else { // 7, 8, 9 and 10
      return [ PRESIDENTIALPOWERS[1], PRESIDENTIALPOWERS[3], PRESIDENTIALPOWERS[4], PRESIDENTIALPOWERS[5], PRESIDENTIALPOWERS[6] ];
    }
  },
  powericons: function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    let numOfPlayers = room.players.length;

    if (numOfPlayers == 3) {
      return FASCISTICONS[3];
    } else if (numOfPlayers <= 6) {
      return FASCISTICONS[5];
    } else if (numOfPlayers <= 8) {
      return FASCISTICONS[7];
    } else if (numOfPlayers <= 10) {
      return FASCISTICONS[9];
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
  },
  policycount: function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);

    let deck = room.drawpile.length;
    let discard = room.discardpile.length
    let liberal = room.liberal;
    let fascist = room.fascist;
    let policychoices = room.policychoices.length;
    let peek = room.peek.length;

    return count = deck + discard + liberal + fascist + policychoices + peek;
  },
  movetracker: function(num) {
    // null check
    if (document.getElementById("tracker-1") == null) {
      return;
    }
    if (num === 0) {
      document.getElementById("tracker-1").classList.remove("fill");
      document.getElementById("tracker-2").classList.remove("fill");
      document.getElementById("tracker-3").classList.remove("fill");
    } else {
      document.getElementById(`tracker-${num}`).classList.add("fill");
    }
    // return num; //uncomment for testing
  },
  moveliberal: function(num) {
    // null check
    if (document.getElementById("liberal-1") == null) {
      return;
    }
    if (num === 0) {
      document.getElementById("liberal-1").classList.remove("fill");
      document.getElementById("liberal-2").classList.remove("fill");
      document.getElementById("liberal-3").classList.remove("fill");
      document.getElementById("liberal-4").classList.remove("fill");
      document.getElementById("liberal-5").classList.remove("fill");
    } else {
      document.getElementById(`liberal-${num}`).classList.add("fill");
    }
  },
  movefascist: function(num) {
    // null check
    if (document.getElementById("fascist-1") == null) {
      return;
    }
    if (num === 0) {
      document.getElementById("fascist-1").classList.remove("fill");
      document.getElementById("fascist-2").classList.remove("fill");
      document.getElementById("fascist-3").classList.remove("fill");
      document.getElementById("fascist-4").classList.remove("fill");
      document.getElementById("fascist-5").classList.remove("fill");
      document.getElementById("fascist-6").classList.remove("fill");
    } else {
      document.getElementById(`fascist-${num}`).classList.add("fill");
    }
  },
  flashmessage: function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    // Meteor.setTimeout(function() {
      // console.log("inside timeout");
    //   Rooms.update(roomId, {$set: {loudspeaker: false}});
    // }, 5000);
    return room.loudspeaker == true;
  },
  ballot: function() {
    let currentPlayerId = Session.get("playerId")
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    let votes = room.votes;
    let ballot = [];

    for (playerId in votes) {
      let player = Players.findOne(playerId);
      let vote = votes[playerId] ? "pass" : "fail";
      let playerVote = {
        name: player.name,
        vote: vote,
        current: player._id == currentPlayerId
      };
      ballot.push(playerVote);
    }
    // console.log("ballot: ", ballot);

    return ballot;
  },
  enddemo: function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    return room.enddemo == true;
  },
})

Template.demogame.events({
  "click .title-card": function() {
    document.getElementById("round").classList.toggle("show");
    document.getElementById("access-code").classList.toggle("show");
  },
  "click .toggle-role": function() {
    document.getElementById("hidden-role").classList.toggle("show");
    // console.log("toggle role");
  },
  "click .yesvote-button": function() {
    let playerId = Session.get("playerId");
    Meteor.call("vote", {
      playerId: playerId,
      vote: true
    });
    Meteor.call("enddemo", {
      playerId: playerId,
    });
  },
  "click .novote-button": function() {
    let playerId = Session.get("playerId");
    Meteor.call("vote", {
      playerId: playerId,
      vote: false
    });
    Meteor.call("enddemo", {
      playerId: playerId,
    });
  },
  "click .fail-continue-button": function() {
    document.getElementById('btn-fail-continue').disabled = true;
    // it looks like you don't need to undisable the button
    let playerId = Session.get("playerId");
    Meteor.call("votecontinue", {
      playerId: playerId
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
      if (room.currentChancellor == -1 && !room.specialelection && !room.deathtags.includes(playerId)) {
        Meteor.call("pickchancellor", {
          playerId: playerId
        });
      }
    }
  },
  "click .button-color-key": function() {
    document.getElementById("color-key").classList.toggle("show");
  },
  "click .btn-win-condition": function() {
    document.getElementById("win-condition").classList.toggle("show");
  },
  "click .powers-button": function() {
    document.getElementById("dropdown-menu").classList.toggle("show");
  },
  "click .power-name": function() {
    let powerId = $(event.target).data("powerid");
    // console.log(`click ${powerId}`);
    document.getElementById(`power-description-${powerId}`).classList.toggle("show");
  },
  "click .endgame-button": function() {
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
  "click .toggle-reveal-vote": function() {
    document.getElementById("reveal-votelist").classList.toggle("show");
    // console.log("toggle reveal vote list");
  },
});
