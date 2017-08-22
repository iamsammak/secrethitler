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
    } else if (_.contains(room.deadindex, player._id)) {
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

    if (_.size(update.votes) == room.alive) {
      update.voted = true;
      update.voteresult = _.countBy(_.values(update.votes), (value) => {
        return value ? "true" : "false";
      }).true > (room.alive / 2) ? "pass" : "fail";

      if (update.voteresult == "pass") {
        update.electiontracker = 0;
        let drawpile = room.drawpile; //already shuffled
        console.log("drawpile", drawpile);
        let policychoices = room.policychoices; //blank right now, []

        if (room.fascist >= 3 && room.players[room.currentChancellor].role == "hitler") {
          update.state = "gameover";
          update.winner = "fascists";
          update.reason = "hitler has been elected!";
          update.players = room.players;
        } else {
          // logic - draw stack is less than 3
          if (drawpile.length < 3) {
            let remaining = drawpile.length;
            for (let i = 0; i < remaining; i++) {
              policychoices = policychoices.concat(drawpile.splice(0, 1))
            }
            drawpile = drawpile.concat(room.discardpile);
            update.discardpile = [];
            _.shuffle(drawpile);

            while (policychoices.length < 3) {
              policychoices = policychoices.concat(drawpile.splice(0, 1));
              console.log("insert single", drawpile.splice(0, 1));
            }
          } else {
            policychoices = drawpile.splice(0, 3);
            console.log("policychoices", policychoices);
          }

          update.drawpile = drawpile;
          update.policychoices = policychoices;
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

          update.trackerenact = {
            topcard: topCard,
            message: `a ${topCard} policy has been enacted!`};
          update.drawpile = drawpile;
        }
      }
    }

    if (room.fascist == 5) { //TODO change back == 5
      update.vetobutton = { president: true, chancellor: true };
    } else {
      update.vetobutton = { president: false, chancellor: false };
    }

    Rooms.update(player.roomId, {
      $set: update
    });

    if (_.size(update.votes) == room.alive) {
      console.log("vote", update);
      return {
        voteresult: update.voteresult,
        electiontracker: update.electiontracker
      };
    }
  },
  "discard" ({ playerId, card }) {
    let player = Players.findOne(playerId);
    if (!player) {
      return;
    }

    let room = Rooms.findOne(player.roomId);
    if (!(card == "liberal" || card == "fascist")) {
      console.log("where did you find this card?");
      return;
    }

    if ((room.policychoices.length == 3 && room.players[room.currentPresident].playerId !== playerId) || (room.policychoices.length == 2 && room.players[room.currentChancellor].playerId != playerId)) {
      return;
    }

    let index = room.policychoices.indexOf(card);
    let discarded = room.policychoices.splice(index, 1);
    let update = {
      policychoices: room.policychoices,
      discardpile: room.discardpile.concat(discarded),
      executiveaction: "inactive"
    };

    if (room.policychoices.length == 1) {
      console.log(room.policychoices);
      if (room.policychoices[0] == "liberal") {
        update.liberal = room.liberal + 1;
      } else if (room.policychoices[0] == "fascist") {
        update.fascist = room.fascist + 1;

        // add executive action here
        let party = room.players.length;
        if (update.fascist == 1 || update.fascist == 2) {
          if (party >= 9 || (party >= 7 && update.fascist == 2)) {
          // if (party >= 3) { // replace this line with the above line when done testing
            console.log("investigate loyalty");
            update.executiveaction = "active";
            update.investigate = true;

            let currPresId = room.players[room.currentPresident].playerId;

            // create an array of players except president
            let suspects = _.filter(room.players, function(player) {
              return player.playerId != currPresId;
            });

            update.suspects = suspects;
          }
        }
        if (update.fascist == 3) {
          if (party >= 7) { // change back to 7
            console.log("call special election");

            update.specialelection = true;
            update.executiveaction = "active";


          } else if (party >= 5) { // change back to 5
            console.log("policy peek");
            let peek = room.drawpile.slice(0, 3);
            update.peek = peek;
            update.executiveaction = "active";
          }
        }
        if (update.fascist == 4) { // change back to == 4
          if (party >= 5) { // change back to 5

            update.executiveaction = "active";
            update.assassination = true;
            console.log("execution", update);
          }
        }
        if (update.fascist == 5) { // change back to update.fascist == 5
          if (party >= 5) { // change back to 5
            console.log("execution and veto unlocked");

            // veto - not an executive special power so executiveaction still inactive
            update.vetobutton = { president: true, chancellor: true };
            update.vetoresult = { president: "", chancellor: "" };
          }
        }
      }
      // reset the room, move round forward and move president placard
      if (update.executiveaction == "inactive") {
        update.round = room.round + 1;
        update.voted = false;
        update.votes = {};
        update.voteresult = "";
        update.currentPresident = (room.currentPresident + 1) % _.size(room.players);
        update.currentChancellor = -1

        if (room.alive <= 3) {
          update.ruledout = [
            room.players[room.currentChancellor].playerId ];
        } else {
          update.ruledout = [
            room.players[room.currentPresident].playerId,
            room.players[room.currentChancellor].playerId ];
        }
        // skip the dead while passing President placard
        if (room.deadindex.length != 0) {
          update.currentPresident = (room.currentPresident + 1) % _.size(room.players);
          while (_.contains(room.deadindex, update.currentPresident)) {
            console.log(update.currentPresident);
            update.currentPresident = (update.currentPresident + 1) % _.size(room.players);
          }
        }
      }
      // reset president rotation to prior special election
      if (room.resetspecialelection.length != 0) {
        console.log("inside reset special election, discard");
        update.currentPresident = (room.resetspecialelection[0] + 1) % _.size(room.players);
        update.resetspecialelection = [];
      }

      // end of game
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
      // policy is enacted
      // reset tracker and policychoices despite executive action or not
      update.policychoices = [];
    }
    console.log("discard", update);
    Rooms.update(player.roomId, { $set: update });
  },
  "investigate" ({ suspectId }) {
    let suspect = Players.findOne(suspectId);
    let  update = {};
    update.investigate = false;
    update.reveal = true;
    update.suspected = [ suspect ];

    Rooms.update(suspect.roomId, { $set: update });
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
      if (topCard == "liberal") {
        update.liberal = room.liberal + 1;
      } else if (topCard == "fascist") {
        update.fascist = room.fascist + 1;
      }

      update.trackerenact = {
        topcard: topCard,
        message: `a ${topCard} policy has been enacted!`};
      // TODO get this flashmessage to work
      // FlashMessages.sendWarning(`a ${topCard} policy has been enacted!`);
      update.electiontracker = 0; //try updating Rooms $set from game.js
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
      if (topCard == "liberal") {
        update.liberal = room.liberal + 1;
      } else if (topCard == "fascist") {
        update.fascist = room.fascist + 1;
      }

      update.trackerenact = {
        topcard: topCard,
        message: `a ${topCard} policy has been enacted!`};
      // TODO get this flashmessage to work
      // FlashMessages.sendWarning(`a ${topCard} policy has been enacted!`);
      update.electiontracker = 0; //same as prez veto, move to promise in game.js
      update.drawpile = drawpile;
    }

    Rooms.update(roomId, { $set: update });
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
  "playagain" ({ roomId }) {
    Rooms.update(roomId, {
      $set: { state: "lobby"}
    });
  },
});
