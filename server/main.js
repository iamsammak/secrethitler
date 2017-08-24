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
    let player = Players.findOne(playerId);
    let room = Rooms.findOne(player.roomId);
    if (room.players.filter(function(player) {
      return player.playerId == playerId;
    }).length > 0) {
      return;
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
      update.electiontracker = 0;
      update.trackerenact = { topcard: "", message: "" };
      update.drawpile = _.shuffle(Utils.drawPolicyDeck());
      update.discardpile = [];
      update.policychoices = [];
      update.round = 1;
      update.started = new Date().getTime();
      update.voted = false;
      update.votes = {};
      update.voteresult = "";
      update.currentPresident = Math.floor(Math.random() * room.players.length);
      update.currentChancellor = -1;
      update.ruledout = [];
      update.liberal = 0;
      update.fascist = 0;
      update.executiveaction = "inactive";
      update.peek = [];
      update.investigate = false;
      update.suspects = [];
      update.reveal = false;
      update.suspected = [];
      update.specialelection = false;
      update.resetspecialelection = [];
      update.vetobutton = { president: false, chancellor: false };
      update.askchancellor = false;
      update.askpresident = false;
      update.vetoresult = { president: "", chancellor: "" };
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

  "continue" ({ playerId, type }) {
    let player = Players.findOne(playerId);
    if (!player) {
      return;
    }
    let room = Rooms.findOne(player.roomId);
    let update = {};

    if (type == "fail") {
      console.log("fail continue");
      update.votes = room.votes
      delete update.votes[playerId];
    } else {
      if (room.players[room.currentPresident].playerId != playerId) {
        return;
      }
    }

    if (type == "peek") {
      console.log("peek continue");
      update.peek = [];
    } else if (type == "investigate") {
      update.investigate = false;
      update.reveal = false;
      update.suspects = [];
      update.suspected = [];
    } else if (type == "execution") {
      update.assassination = false;
      update.playerdied = false;
    }

    if ((type == "peek" || type == "investigate" || type == "execution") || (_.size(update.votes) == 0)) {
      update.round = room.round + 1;
      update.voted = false;
      update.votes = {};
      update.voteresult = "";
      update.currentChancellor = -1;
      update.executiveaction = "inactive";

      if (room.alive <= 3) {
        update.ruledout = [
          room.players[room.currentChancellor].playerId ];
      } else {
        update.ruledout = [
          room.players[room.currentPresident].playerId,
          room.players[room.currentChancellor].playerId ];
      }

      if (type == "fail") {
        update.ruledout = room.ruledout;
      }

      if (room.resetspecialelection.length != 0) {
        update.currentPresident = (room.resetspecialelection[0] + 1) % _.size(room.players);
        update.resetspecialelection = [];
      } else {
        if (room.deadindex.length != 0) {
          update.currentPresident = (room.currentPresident + 1) % _.size(room.players);
          while (_.contains(room.deadindex, update.currentPresident)) {
            console.log(update.currentPresident);
            update.currentPresident = (update.currentPresident + 1) % _.size(room.players);
          }
        } else {
          update.currentPresident = (room.currentPresident + 1) % _.size(room.players);
        }
      }
    }


    Rooms.update(player.roomId, { $set: update });
  },

  "veto" ({ playerId, official }) {
    let player = Players.findOne(playerId);
    let room = Rooms.findOne(player.roomId);
    let update = {
      vetobutton: room.vetobutton
    };

    if (official == "president") {
      update.askchancellor = true;
    } else if (official == "chancellor") {
      update.askpresident = true;
    }
    // toggle off the official's veto button
    update.vetobutton[official] = false;

    console.log("veto", update);
    Rooms.update(player.roomId, { $set: update });
  },
  "veto-vote" ({ playerId, official, vote }) {
    let player = Players.findOne(playerId);
    let room = Rooms.findOne(player.roomId);
    let update = {
      vetoresult: room.vetoresult
    };

    if (vote) {
      update.vetoresult[official] = "pass";
    } else {
      update.vetoresult[official] = "fail";
    }

    update.askpresident = false;
    update.askchancellor = false;

    console.log("veto-vote", update);
    Rooms.update(player.roomId, { $set: update });
  },
  "president-veto-continue" ({ roomId }) {
    let room = Rooms.findOne(roomId);
    let update = {};

    let drawpile = room.drawpile;
    let discardpile = room.discardpile.concat(room.policychoices);
    let policychoices = [];

    if (drawpile.length < 3) {
      let remaining = drawpile.length;
      for (let i = 0; i < remaining; i++) {
        policychoices.push(drawpile.splice(0, 1))
      }
      drawpile = drawpile.concat(discardpile);
      discardpile = [];
      _.shuffle(drawpile);

      while (policychoices.length < 3) {
        policychoices.push(drawpile.splice(0, 1));
        console.log("insert single", drawpile.splice(0, 1));
      }
    } else {
      policychoices = drawpile.splice(0, 3);
      console.log("policychoices", policychoices);
    }

    update.drawpile = drawpile;
    update.discardpile = discardpile;
    update.policychoices = policychoices;
    update.vetoresult = { president: "", chancellor: "" };
    update.electiontracker = room.electiontracker + 1;

    if (update.electiontracker == 3) {
      if (drawpile.length == 0 ) {
        drawpile = drawpile.concat(update.discardpile);
        update.discardpile = [];
      }

      let topCard = drawpile.splice(0, 1)

      update.trackerenact = {
        topcard: topCard,
        message: `a ${topCard} policy has been enacted!`};
      update.drawpile = drawpile;
    }

    Rooms.update(roomId, { $set: update });
  },
  "chancellor-veto-continue" ({ roomId }) {
    let room = Rooms.findOne(roomId);
    let update = {};
    update.discardpile = room.discardpile.concat(room.policychoices);
    update.vetobutton = { president: true, chancellor: true };
    update.vetoresult = { president: "", chancellor: "" };
    update.round = room.round + 1;
    update.policychoices = [];
    update.voted = false;
    update.votes = {};
    update.voteresult = "";
    update.currentPresident = (room.currentPresident + 1) % _.size(room.players);
    update.currentChancellor = -1
    update.electiontracker = room.electiontracker + 1;

    if (room.alive <= 3) {
      update.ruledout = [
        room.players[room.currentChancellor].playerId ];
    } else {
      update.ruledout = [
        room.players[room.currentPresident].playerId,
        room.players[room.currentChancellor].playerId ];
    }

    if (update.electiontracker == 3) {
      let drawpile = room.drawpile;

      if (drawpile.length == 0 ) {
        drawpile = drawpile.concat(update.discardpile);
        update.discardpile = [];
      }

      let topCard = drawpile.splice(0, 1)

      update.trackerenact = {
        topcard: topCard,
        message: `a ${topCard} policy has been enacted!`};
      update.drawpile = drawpile;
    }

    Rooms.update(roomId, { $set: update });
  },
  "playagain" ({ roomId }) {
    Rooms.update(roomId, {
      $set: { state: "lobby"}
    });
  },
});
