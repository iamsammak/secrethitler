import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import Utils from './utils.js';
import { Rooms, Players } from '../imports/api/collections.js';

Meteor.methods({
  "discard" ({ playerId, card }) {
    let player = Players.findOne(playerId);
    let room = Rooms.findOne(player.roomId);

    if (!player) {
      return;
    }
    if (!(card == "liberal" || card == "fascist")) {
      // console.log("where did you find this card?");
      return;
    }
    if ((room.policychoices.length == 3 && room.players[room.currentPresident].playerId !== playerId) || (room.policychoices.length == 2 && room.players[room.currentChancellor].playerId != playerId)) {
      return;
    }

    let index = room.policychoices.indexOf(card);
    let discardPolicy = room.policychoices.splice(index, 1);
    // console.log("discarded", discardPolicy);
    let update = {
      policychoices: room.policychoices,
      discardpile: room.discardpile.concat(discardPolicy),
      executiveaction: "inactive" //not sure why this is here TODO
    };

    if (room.policychoices.length == 1) {
      // console.log("enacting chosen card", room.policychoices);
      if (room.policychoices[0] == "liberal") {
        update.liberal = room.liberal + 1;
      } else if (room.policychoices[0] == "fascist") {
        update.fascist = room.fascist + 1;

        // executive action below - presidential powers
        let party = room.players.length;
        // investigate loyalty
        if (update.fascist == 1 || update.fascist == 2) {
          if(party >= 9 || (party >= 7 && update.fascist == 2) || (party == 3 && update.fascist == 2)) {
            // if (party >= 3) { // replace this line with the above line when done testing
            // console.log("investigate loyalty");
            update.executiveaction = "active";
            update.investigate = true;

            let currentPresidentId = room.players[room.currentPresident].playerId;

            // create an array of players minus the president
            let suspects = _.filter(room.players, function(player) {
              return player.playerId != currentPresidentId;
            });

            update.suspects = suspects;
          }
        }
        // call special election and policy peek
        if (update.fascist == 3) {
          if (party >= 7) { // change back to 7
            // console.log("call special election");
            update.executiveaction = "active";
            update.specialelection = true;
          } else if (party >= 5 || party == 3) { // change back to 5
            // console.log("policy peek");
            let drawpile = room.drawpile;
            let peek = drawpile.slice(0, 3);
            // if drawpile is less than 3. shuffle discardpile into drawpile then peek
            if (peek.length < 3) {
              let discardpile = _.shuffle(update.discardpile);
              update.discardpile = [];
              drawpile = room.drawpile.concat(discardpile);
              update.drawpile = drawpile;
              peek = drawpile.slice(0, 3);
            }
            update.peek = peek;
            update.executiveaction = "active";
          }
        }
        // execution
        if (update.fascist == 4 || update.fascist == 5) { // change back to 4 || 5
          if (party >= 5 || party == 3) { //change back to 5
            // console.log("execution");
            update.executiveaction = "active";
            update.assassination = true;
          }
        }
        // veto power (to test, remember to update 'voting' line 104)
        if (update.fascist >= 5) { // change back to == 5
          if (party >= 5 || party == 3) { // change back to 5
            // console.log("veto power unlocked");
            update.vetobutton = { president: true, chancellor: true };
            update.vetoresult = { president: "", chancellor: "" };
          }
          // need to check if round moves forward since execution turns on executive action
        }
      }
      // Room resetting - vote passed, policy enacted
      if (update.executiveaction == "inactive") {
        update.round = room.round + 1;
        update.voted = false;
        update.votes = {};
        update.voteresult = "";
        update.currentPresident = (room.currentPresident + 1) % _.size(room.players);
        update.currentChancellor = -1;

        // if only 3 players are alive, only last chanchellor is ineligible to be next chan
        if (room.alive <= 3) {
          update.ruledout = [
          room.players[room.currentChancellor].playerId ];
        } else {
          update.ruledout = [
          room.players[room.currentPresident].playerId,
          room.players[room.currentChancellor].playerId ];
        }
        // skip the dead while passing Presidential placard
        if (room.deadindex.length != 0) {
          update.currentPresident = (room.currentPresident + 1) % _.size(room.players);
          while (_.contains(room.deadindex, update.currentPresident)) {
            // console.log(update.currentPresident);
            update.currentPresident = (update.currentPresident + 1) % _.size(room.players);
          }
        }

        // reset president rotation to prior clockwise, after special election occured
        if (room.resetspecialelection.length != 0) {
          console.log("inside reset special election, discard");
          debugger
          update.currentPresident = (room.resetspecialelection[0] + 1) % _.size(room.players);
          update.resetspecialelection = [];
        }
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
      // policy is enacted so reset policychoices
      update.policychoices = [];
    }
    // console.log("end of discard", update);
    Rooms.update(player.roomId, { $set: update });
  },

});
