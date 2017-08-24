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

    if (deceased.role == "hitler") {
      update.state = "gameover";
      update.winner = "liberals";
      update.reason = "hitler has been assassinated!";
      update.players = room.players;
    }

    console.log("assassinating", update);

    Rooms.update(roomId, { $set: update });
  },
});
