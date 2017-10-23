import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import Utils from './utils.js';
import { Rooms, Players } from '../imports/api/collections.js';

Meteor.startup(() => {
  // code to run on server at startup
  // add clean up game and players logic
  // install mrt: cron-tick and use cron to schedule game and player removal after set time duration
  let http = require("http");
  setInterval(function() {
      http.get("http://secrethitler-ubiquitousfriends.herokuapp.com");
  }, 300000); // every 5 minutes (300000)
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

function cleanUpDatabase() {
  // remove old rooms and players
  let cutOffTime = moment().subtract(24, 'hours').toDate().getTime();

  let numRoomsRemoved = Rooms.remove({
    createdAt: {$lt: cutOffTime}
  });

  let numPlayersRemoved = Players.remove({
    createdAt: {$lt: cutOffTime}
  });

  // During testing
  // console.log(moment().format('MMMM Do YYYY, h:mm:ss a'));
  // console.log("cleaning - num of rooms removed:", numRoomsRemoved);
  // console.log("cleaning - num of players removed:", numPlayersRemoved);
}

// Cron Job to remove old rooms and players
let MyCron = new Cron(60000);
MyCron.addJob(5, cleanUpDatabase);

Meteor.methods({
  "newgame"({ name, codename, demo }) {
    let lobbyState;
    demo ? lobbyState = "demolobby" : lobbyState = "lobby"
    // console.log("lobby state", lobbyState);

    let accessCode = Random.hexString(6);
    name = name.trim();
    codename = codename.trim();
    // console.log(name);

    while (Rooms.find({accessCode:accessCode}).count() > 0) {
      // console.log(accessCode);
      accessCode = Random.hexString(6);
      // console.log(accessCode);
    }

    let roomId = Rooms.insert({
      accessCode: accessCode,
      createdAt: new Date().getTime(),
      state: lobbyState,
      tableSeats: []
    });

    let playerId = Players.insert({
      roomId: roomId,
      name: name,
      codename: codename,
      createdAt: new Date().getTime()
    });

    Rooms.update(roomId, {
      $set: { owner: playerId }
    });

    return [roomId, playerId, accessCode];
  },
  "leavegame" ({ playerId }) {
    // console.log("removing", playerId);
    Players.remove({ _id: `${playerId}`});
  },
  "playagain" ({ roomId }) {
    Rooms.update(roomId, { $set: { state: "lobby"} });
  },
  "joingame" ({ name, codename, roomId, view }) {
    let room = Rooms.findOne(roomId);
    name = name.trim();
    if (!room) {
      return;
    }
    // write logic for returning players after game has started
    // find old player Id
    let oldPlayer = Players.findOne({roomId:roomId, name: name});

    if (oldPlayer != undefined) {
      // divide this based on what the current game.state is
      if (oldPlayer.codename === codename) {
        // copy all player data attached to old playerId
        // create a new playerID and copy over old player data
        let newPlayerId = Players.insert({
          roomId: roomId,
          name: name,
          codename: codename,
          createdAt: new Date().getTime(),
          role: oldPlayer.role,
          index: oldPlayer.index
        });
        // console.log("newPlayerId", newPlayerId);
        // need to update all the game info params that point to the oldPlayerId
        let update = {};
        // change owner
        if (room.owner == oldPlayer._id) {
          update.owner = newPlayerId;
        }

        let players = room.players;
        if (players != undefined) {
          // change id in players
          players.forEach(function(player) {
            if (player.playerId === oldPlayer._id) {
              player.playerId = newPlayerId;
            }
          });
          update.players = players;
        }
        let tableSeats = room.tableSeats;
        if (tableSeats != undefined) {
          // change id in tableSeats
          tableSeats.forEach(function(player) {
            if (player.playerId === oldPlayer._id) {
              player.playerId = newPlayerId;
            }
          });
          update.tableSeats = tableSeats;
        }
        let teamliberals = room.teamliberals;
        if (teamliberals != undefined) {
          // change id in players
          teamliberals.forEach(function(player) {
            if (player.playerId === oldPlayer._id) {
              player.playerId = newPlayerId;
            }
          });
          update.teamliberals = teamliberals;
        }
        let teamfascists = room.teamfascists;
        if (teamfascists != undefined) {
          // change id in players
          teamfascists.forEach(function(player) {
            if (player.playerId === oldPlayer._id) {
              player.playerId = newPlayerId;
            }
          });
          update.teamfascists = teamfascists;
        }

        if (view == "game" || view == "gameover") {
          // Only reupdate these if the game has already started

          // change id in votes
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
        }

        Rooms.update(roomId, {$set: update});

        // remove old player from room
        // console.log("removing", oldPlayer._id);
        Players.remove({ _id: `${oldPlayer._id}`});

        return [roomId, newPlayerId, room.state];
      } else {
        // console.log("wrong password, there is someone already logged in with the same name");
        return;
      }

    } // end of oldPlayer != undefined

    // normal join game - new player insertion
    let playerId = Players.insert({
      roomId: roomId,
      name: name,
      codename: codename,
      createdAt: new Date().getTime()
    });
    return [roomId, playerId, "lobby"];
  },
  "startgame" ({ roomId, demo }) {
    let tableState;
    demo ? tableState = "demotable" : tableState = "table"
    // console.log("table state", tableState);

    let room = Rooms.findOne(roomId);
    let players = Players.find({ roomId: roomId }).fetch();
    let teamfascists = [];
    let teamliberals = [];
    let roles = _.shuffle(Utils.drawRoleCards(players.length));
    // console.log(roles);

    players.forEach(function(player, idx) {
      // I want to add players into the room.players

      Players.update(player._id, {
        $set: { role: roles[idx] }
      });

      if (roles[idx] == "fascist" || roles[idx] == "hitler") {
        teamfascists.push({
          name: player.name,
          playerId: player._id,
          hitler: roles[idx] == "hitler"
        });
      } else {
        teamliberals.push({
          name: player.name,
          playerId: player._id
        });
      }

      // insert into room
      room.tableSeats.push({
        playerId: player._id,
        name: player.name,
        role: roles[idx]
      });
    });
    // console.log("teamfascists:", teamfascists);
    // console.log("teamliberals", teamliberals);
    // I need to do something about add players to the room as the room.state changes from lobby to table
    Rooms.update(roomId, {
      $set: {
        state: tableState,
        tableSeats: room.tableSeats,
        players: [],
        teamfascists: teamfascists,
        teamliberals: teamliberals,
        size: players.length
      }
    });
  },
  "ready" ({ playerId, demo }) {
    let readyState;
    demo ? readyState = "demogame" : readyState = "game"
    // console.log("game state", readyState);

    let player = Players.findOne(playerId);
    let room = Rooms.findOne(player.roomId);

    // if the player is already in the room, then return
    if (room.players.filter(function(player) {
      return player.playerId == playerId;
    }).length > 0) {
      return;
      // console.log("player already in the room, I think");
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
      update.state = readyState;
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
      if (demo) { update.currentPresident = 4; }
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
      // end demo
      update.enddemo = false;
    }

    Players.update(playerId, {
      $set: { index: index }
    })
    Rooms.update(player.roomId, {
      $set: update
    });
  },
  "enddemo" ({ playerId }) {
    let player = Players.findOne(playerId);
    let room = Rooms.findOne(player.roomId);

    Rooms.update(player.roomId, {
      $set: { enddemo: true }
    });
  }
});
