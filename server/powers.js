import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import Utils from './utils.js';
import { Rooms, Players } from '../imports/api/collections.js';

Meteor.methods({
  "investigate" ({ suspectId }) {
    let suspect = Players.findOne(suspectId);
    let update = {};
    update.investigate = false;
    update.reveal = true;
    update.suspected = [ suspect ];

    Rooms.update(suspect.roomId, { $set: update });
  },
  "specialelection" ({ nextPresident, currentPlayerId }) {
    let currentPlayer = Players.findOne(currentPlayerId);
    let room = Rooms.findOne(currentPlayer.roomId);

    let update = { currentPresident: nextPresident.index };
    update.round = room.round + 1;
    update.voted = false;
    update.votes = {};
    update.voteresult = "";
    update.ruledout = [
      room.players[room.currentPresident].playerId,
      room.players[room.currentChancellor].playerId];
    update.currentChancellor = -1
    update.executiveaction = "inactive";
    update.specialelection = false;
    update.resetspecialelection = [ room.currentPresident ];

    Rooms.update(room._id, { $set: update });
  },
  "assassination" ({ deceased }) {
    let roomId = deceased.roomId;
    let room = Rooms.findOne(roomId);
    let update = {};

    let dead = room.dead;
    dead.unshift(deceased);
    update.dead = dead;

    let deathtags =  room.deathtags;
    deathtags.unshift(deceased._id)
    update.deathtags = deathtags;

    let deadindex =  room.deadindex;
    deadindex.unshift(deceased.index)
    update.deadindex = deadindex;

    update.playerdied = true;
    update.alive = room.alive - 1;
    update.assassination = false;

    // after special election, if you execute the "would be" next president via clockwise
    // then it should move on - so logic needs to be added for this case

    if (deceased.role == "hitler") {
      update.state = "gameover";
      update.winner = "liberals";
      update.reason = "hitler has been assassinated!";
      update.players = room.players;
    }

    // console.log("assassinating", update);

    Rooms.update(roomId, { $set: update });
  },
  "powercontinue" ({ playerId, type }) {
    let player = Players.findOne(playerId);
    if (!player) {
      return;
    }

    let room = Rooms.findOne(player.roomId);
    if (room.players[room.currentPresident].playerId != playerId) {
      return;
    }

    let update = {};

    // Room resetting - after president viewed peek, investigated, or executed a player
    if (type == "peek") {
      // console.log("peek continue");
      update.peek = [];
    } else if (type == "investigate") {
      // console.log("investigate continue");
      update.investigate = false;
      update.reveal = false;
      update.suspects = [];
      update.suspected = [];
    } else if (type == "execution") {
      update.assassination = false;
      update.playerdied = false;
    }

    update.executiveaction = "inactive";
    update.round = room.round + 1;
    update.voted = false;
    update.votes = {};
    update.voteresult = "";
    update.currentChancellor = -1;

    if (room.alive <= 3) {
      update.ruledout = [
        room.players[room.currentChancellor].playerId ];
    } else {
      update.ruledout = [
        room.players[room.currentPresident].playerId,
        room.players[room.currentChancellor].playerId ];
    }

    if (room.resetspecialelection.length != 0) {
      update.currentPresident = (room.resetspecialelection[0] + 1) % _.size(room.players);
      update.resetspecialelection = [];
    } else {
      if (room.deadindex.length != 0) {
        update.currentPresident = (room.currentPresident + 1) % _.size(room.players);
        while (_.contains(room.deadindex, update.currentPresident)) {
          // console.log(update.currentPresident);
          update.currentPresident = (update.currentPresident + 1) % _.size(room.players);
        }
      } else {
        update.currentPresident = (room.currentPresident + 1) % _.size(room.players);
      }
    }

    Rooms.update(player.roomId, { $set: update });
  },
});
