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



});
