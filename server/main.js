import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import Utils from './utils.js';
import { Rooms, Players } from '../imports/api/collections.js';

Meteor.startup(() => {
  // code to run on server at startup
});

Meteor.publish("rooms", function(code) {
  return Rooms.find({
    accessCode: code
  });
});

Meteor.publish("players", function(roomId) {
  return Players.find({
    roomId: roomId
  });
});

Meteor.methods({
  "newgame"({name}) {
    let accessCode = Random.hexString(6);
    name = name.trim();
    console.log(name);

    while (Rooms.find({accessCode:accessCode}).count() > 0) {
      console.log(accessCode);
      accessCode = Random.hexString(6);
      console.log(accessCode);
    }

    let roomId = Rooms.insert({
      accessCode: accessCode,
      started: new Date().getTime(),
      state: "lobby"
    });

    let playerId = Players.insert({
      roomId: roomId,
      name: name
    });

    Rooms.update(roomId, {
      $set: { owner: playerId }
    });

    return [roomId, playerId, accessCode];
  },
  "leavegame" ({ playerId }) {
    console.log("removing", playerId);
    Players.remove({ _id: `${playerId}`});
  },
  "playagain" ({ roomId }) {
    Rooms.update(roomId, { $set: { state: "lobby"} });
  },
  "joingame" ({ name, roomId }) {
    let room = Rooms.findOne(roomId);
    name = name.trim();
    if (!room) {
      return;
    }
    if (room.state !== "lobby") {
      console.log("main.js server line 63");
      return;
    }
    if (Players.find({ roomId: roomId, name: name}).count() > 0) {
      return;
    }
    let playerId = Players.insert({
      roomId: roomId,
      name: name
    });
    return [roomId, playerId];
  },
  "startgame" ({ roomId }) {
    let players = Players.find({ roomId: roomId }).fetch();
    let fascists = [];
    let liberals = [];
    let roles = _.shuffle(Utils.drawRoleCards(players.length));
    console.log(roles);
    players.forEach(function(player, idx) {
      Players.update(player._id, {
        $set: { role: roles[idx] }
      });

      if (roles[idx] == "fascist" || roles[idx] == "hitler") {
        fascists.push({
          name: player.name,
          playerId: player._id,
          hitler: roles[idx] == "hitler"
        });
      } else {
        liberals.push({
          name: player.name,
          playerId: player._id
        });
      }
    });
    console.log("fascists:", fascists);
    console.log("liberals", liberals);
    Rooms.update(roomId, {
      $set: {
        state: "seating",
        players: [],
        fascist: fascists,
        liberal: liberals,
        size: players.length
      }
    });
  },
  "ready" ({ playerId }) {
    // probably need to write reset room logic first.
    // to prepare for multiple games/restarts
    let player = Players.findOne(playerId);
    let room = Rooms.findOne(player.roomId);

    // if the player is already in the room, then return
    if (room.players.filter(function(player) {
      return player.playerId == playerId;
    }).length > 0) {
      return;
      console.log("player already in the room, I think");
    }

    // to track position later
    let index = room.players.length;

    // insert into room
    room.players.push({
      playerId: player._id,
      name: player.name,
      role: player.role
    });

    // to be $set later into Rooms collection
    let update = {
      players: room.players
    };
    // add to update once everyone is in the room TODO first update
    if (Players.find({ roomId: room._id }).count() == room.players.length) {
      update.state = "game";
      update.winner = "";
      update.reason = "";
      update.round = 1;
      update.started = new Date().getTime();
      // testflash
      update.loudspeaker = false;
      // election tracker params
      update.electiontracker = 0;
      update.trackerenact = { topcard: "", message: "" };
      // policy - 17 count
      update.drawpile = _.shuffle(Utils.drawPolicyDeck());
      update.discardpile = [];
      update.policychoices = [];
      // policy count
      update.liberal = 0;
      update.fascist = 0;
      // voting params
      update.voted = false;
      update.votes = {};
      update.voteresult = "";
      // executive branch placard params
      update.currentPresident = Math.floor(Math.random() * room.players.length);
      update.currentChancellor = -1;
      update.ruledout = [];
      // executive presidential powers
      update.executiveaction = "inactive";
      // peek params
      update.peek = [];
      // investigation params
      update.investigate = false;
      update.suspects = [];
      update.reveal = false;
      update.suspected = [];
      // special election params
      update.specialelection = false;
      update.resetspecialelection = [];
      // veto params
      update.vetobutton = { president: false, chancellor: false };
      update.askchancellor = false;
      update.askpresident = false;
      update.vetoresult = { president: "", chancellor: "" };
      // execution params
      update.alive = room.players.length;
      update.dead = [];
      update.deathtags = [];
      update.deadindex = [];
      update.assassination = false;
      update.playerdied = false;
    }

    Players.update(playerId, {
      $set: { index: index }
    })
    Rooms.update(player.roomId, {
      $set: update
    });
  },
});
