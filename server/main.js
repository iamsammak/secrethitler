import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import Utils from './utils.js';
import { Rooms, Players } from '../imports/api/collections.js';

Meteor.startup(() => {
  // code to run on server at startup
  // add clean up game and players logic
  // install mrt: cron-tick and use cron to schedule game and player removal after set time duration
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
  "newgame"({ name, codename }) {
    let accessCode = Random.hexString(6);
    name = name.trim();
    codename = codename.trim();
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
      name: name,
      codename: codename
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
  "joingame" ({ name, codename, roomId }) {
    let room = Rooms.findOne(roomId);
    name = name.trim();
    if (!room) {
      return;
    }
    // write logic for returning players
    // things that need to happen
    // find old player Id
    let oldPlayer = Players.findOne({roomId:roomId, name: name});

    if (oldPlayer != undefined) {
      // copy all player data attached to old playerId
      // create a new playerID and copy over old player data
      if (oldPlayer.codename === codename) {
        let newPlayerId = Players.insert({
          roomId: roomId,
          name: name,
          codename: codename,
          role: oldPlayer.role,
          index: oldPlayer.index
        });
        // if the game has already started...
        // need to update all the game info params that point to the oldPlayerId
        let update = {};
        // owner, players, votes, dead
        if (room.owner == oldPlayer._id) {
          update.owner = newPlayerId;
        }
        // players
        let players = room.players;
        players.forEach(function(player) {
          if (player.playerId === oldPlayer._id) {
            player.playerId = newPlayerId;
          }
        });
        update.players = players;
        // votes
        // only update votes if the oldPlayer has a vote inside room.votes
        let votes = room.votes;
        if (votes[oldPlayer._id] != undefined) {
          votes[newPlayerId] = votes[oldPlayer._id]
          delete votes[oldPlayer._id]
          update.votes = votes;
        }
        // if reentering player was dead
        if (room.deathtags.includes(oldPlayer._id)) {
          let dead = room.dead;
          let deathtags = room.deathtags;
          dead.forEach(function(player) {
            if (player.playerId === oldPlayer._id) {
              player.playerId = newPlayerId;
            }
          });
          let oldTagIdx = deathtags.indexOf(oldPlayer._id);
          deathtags.splice(oldTagIdx, 1);
          deathtags.push(newPlayerId);

          update.dead = dead;
          update.deathtags = deathtags;
        }

        Rooms.update(roomId, {$set: update});

        // remove old player from room
        Players.remove({ _id: `${oldPlayer._id}`});

        // bugs
        // need to "fill" the game boards and election trackers
        return [roomId, newPlayerId, room.state];
      } else {
        return;
      }
    }
    // normal join game - player insertion
    let playerId = Players.insert({
      roomId: roomId,
      name: name,
      codename: codename
    });
    return [roomId, playerId, "lobby"];
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
        state: "table",
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
