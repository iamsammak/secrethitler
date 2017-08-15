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
    let accessCode = Utils.createCode("temp");
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
    // add to update once everyone is in the room
    if (Players.find({ roomId: room._id }).count() == room.players.length) {
      update.state = "game";
      update.electiontracker = 0;
      update.trackerfull = "";
      update.drawpile = _.shuffle(Utils.drawPolicyDeck);
      update.discardpile = [];
      update.policychoices = [];
      update.round = 1;
      update.started = new Date().getTime();
      update.voted = false;
      update.votes = {};
      update.voteresult = 0;
      // saving by index
      update.currentPresident = Math.floor(Math.random() * room.players.length);
      update.currentChancellor = -1;
      update.ruledout = [];
      update.liberal = 0;
      update.fascist = 0;
    }

    Players.update(playerId, {
      $set: { index: index }
    })
    Rooms.update(player.roomId, {
      $set: update
    });
  },
  "pickchancellor" ({ playerId }) {
    let player = Players.findOne(playerId);
    if (!player) {
      return;
    }
    let room = Rooms.findOne(player.roomId);
    if (room.currentChancellor > -1) {
      return;
    } else if (player.index == room.currentPresident) {
      return;
    } else if (_.contains(room.ruledout, player._id)) {
      return;
    } else {
      Rooms.update(player.roomId, {
        $set: { currentChancellor: player.index }
      });
    }
  },
  "vote" ({ playerId, vote }) {
    let player = Players.findOne(playerId);
    let room = Rooms.findOne(player.roomId);
    let update = { votes: room.votes };

    update.votes[playerId] = vote;

    if (_.size(update.votes) == _.size(room.players)) {
      update.voted = true;
      update.voteresult = _.countBy(_.values(update.votes), (value) => {
        return value ? "true" : "false";
      }).true > (_.size(room.players) / 2) ? 1 : -1;

      if (update.voteresult == 1) {
        update.electiontracker = 0;

        if (room.fascist >= 3 && room.players[room.currentChancellor].role == "hitler") {
          update.state = "gameover";
          update.winner = "fascists";
          update.reason = "hitler has been elected!";
          update.players = room.players;
          for (let i = 0; i < room.players.length; i += 1) {
            update.players[i].side = Players.findOne(room.players[i].playerId).role;
          }
        } else {
          let drawpile = room.drawpile; //already shuffled
          // might need to change this shuffle option, if we include special "seeing powers"
          // if the draw stack > 3, add the remaining to policy choices then shuffle discard back into draw stack
          if (drawpile.length < 3) {
            let remaining = drawpile.length;
            update.policychoices.push(drawpile.splice(0, remaining))
            drawpile = drawpile.concat(room.discardpile);
            update.discardpile = [];
            _.shuffle(drawpile);

            while (update.policychoices.length < 3) {
              update.policychoices.push(drawpile.splice(0, 1));
            }
          } else {
            update.policychoices = drawpile.splice(0, 3);
          }

          update.drawpile = drawpile;
        }
      } else { //meaning vote failed
        update.electiontracker = room.electiontracker + 1;
        // pass top policy if electrion tracker is at 3
        if (update.electiontracker == 3) {
          let drawpile = room.drawpile;

          if (drawpile.length == 0 ) {
            drawpile = drawpile.concat(room.discardpile);
            update.discardpile = [];
          }

          let topCard = drawpile.splice(0, 1)
          if (topCard == "liberal") {
            update.liberal = room.liberal + 1;
          } else if (topCard == "fascist") {
            update.fascist = room.fascist + 1;
          }

          update.trackerfull = `a ${topCard} policy has been enacted!`
          update.electiontracker = 0;
          update.drawpile = drawpile;
        }
      }
    }

    Rooms.update(player.roomId, {
      $set: update
    });
  },
  "failcontinue" ({ playerId }) {
    let player = Players.findOne(playerId);
    if (!player) {
      return
    }
    let room = Rooms.findOne(player.roomId);
    let update = { votes: room.votes };
    delete update.votes[playerId];

    if (_.size(update.votes) == 0) {
      update.trackerfull = "";
      update.round = room.round + 1;
      update.voted = false;
      update.votes = {};
      update.voteresult = 0;
      update.ruledout = [
        room.players[room.currentPresident].playerId,
        room.player[room.currentChancellor].playerId];
      update.currentPresident = (room.currentPresident + 1) % _.size(room.players);
      update.currentChancellor = -1;
    }

    Rooms.update(player.roomId, { $set: update });
  },
  "discard" ({ playerId, card }) {
    let player = Players.findOne(playerId);
    if (!player) {
      return;
    }

    let room = Rooms.findOne(player.roomId);
    if (!(card == "liberal" || card == "fascist")) {
      return;
    }

    if ((room.policychoices.length == 3 && room.players[room.currentPresident].playerId !== playerId) || (room.policychoices.length == 2 && room.players[room.currentChancellor].playerId != playerId)) {
      return;
    }

    let index = room.policychoices.indexOf(card);
    room.policychoices.splice(index, 1);
    let update = {
      policychoices: room.policychoices,
      discardpile: room.discardpile.concat([card])
    };

    if (room.policychoices.length == 1) {
      console.log(room.policychoices);
      if (room.policychoices[0] == "liberal") {
        update.liberal = room.liberal + 1;
      } else if (room.policychoices[0] == "fascist") {
        update.fascist = room.fascist + 1;
      }

      update.round = room.round + 1;
      update.policychoices = [];
      update.voted = false;
      update.votes = {};
      update.voteresult = 0;
      update.ruledout = [
        room.players[room.currentPresident].playerId,
        room.players[room.currentChancellor].playerId];
      update.currentPresident = (room.currentPresident + 1) % _.size(room.players);
      update.currentChancellor = -1;

      if (update.liberal == 5 || update.fascist == 6) {
        update.state = "gameover";
        if (update.liberal == 5) {
          update.winner = "liberals";
          update.reason = "liberals have passed 5 policies!";
        } else if (update.fascist == 6) {
          update.winner = "fascists";
          update.reason = "fascists have passed 6 policies!";
        }
        update.players = room.players;
        for (let i = 0; i < room.players.length; i += 1) {
          update.players[i].side = Players.findOne(room.players[i].playerId).role;
        }
      }
    }
    Rooms.update(player.roomId, { $set: update });
  }

});
