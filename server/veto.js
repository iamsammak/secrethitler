import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import Utils from './utils.js';
import { Rooms, Players } from '../imports/api/collections.js';

Meteor.methods({
  "veto" ({ playerId, official }) {
    let player = Players.findOne(playerId);
    let room = Rooms.findOne(player.roomId);
    let update = {
      vetobutton: room.vetobutton
    };

    if (official === "president") {
      update.askchancellor = true;
    } else if (official === "chancellor") {
      update.askpresident = true;
    }

    // toggle off the official's veto button
    update.vetobutton[official] = false;

    // console.log(`veto suggested by ${official}` , update);
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

    // console.log(`${official} has been ${update.vetoresult[official]}`);
    // console.log("veto-vote", update);
    Rooms.update(player.roomId, { $set: update });
  },
  "president-veto-continue" ({ roomId }) {
    let room = Rooms.findOne(roomId);
    let update = {};
    let drawpile = room.drawpile;
    // veto approved, so discard 3 current policies and draw 3 new ones
    let discardpile = room.discardpile.concat(room.policychoices);
    let policychoices = [];
      // console.log(`drawpile:`, drawpile);
    if (drawpile.length < 3) {
      let remaining = drawpile.length;
      let fillToThree = 3 - remaining;

      policychoices = policychoices.concat(drawpile.splice(0, remaining));
        // console.log(`splice to remaining`, policychoices);
      drawpile = drawpile.concat(discardpile);
        // console.log("concat discard into drawpile", drawpile);
      discardpile = [];
      _.shuffle(drawpile);

      policychoices = policychoices.concat(drawpile.splice(0, fillToThree));
        // console.log(`policychoices after fillToThree`, policychoices);
    } else if (drawpile.length >= 3){
      policychoices = drawpile.splice(0, 3);
        // console.log("draw three from the deck", policychoices);
    }
    // reset new deck, discard and policychoices
    update.drawpile = drawpile;
    update.discardpile = discardpile;
    update.policychoices = policychoices;
    // reset veto params
    update.vetoresult = { president: "", chancellor: "" };
    update.electiontracker = room.electiontracker + 1;
    update.trackerenact = { topcard: "", message: "" };

    // check if election tracker is at 3, if so then enact top policy
    if (update.electiontracker === 3) {
        // console.log("tracker at 3. drawpile:", drawpile);
      if (drawpile.length == 0) {
        drawpile = drawpile.concat(update.discardpile);
        update.discardpile = [];
          // console.log("tracker at 3. concat discard into drawpile", drawpile);
      }

      let topCard = drawpile.splice(0, 1);
      // election tracker is reset client side "utils.js" via promise
      update.trackerenact = {
        topcard: topCard,
        message: `a ${topCard} policy has been enacted!`
      };
      update.drawpile = drawpile;

      update.electiontracker = 0;
      if (topCard == "liberal") {
        update.liberal = room.liberal + 1;
      } else if (topCard == "fascist") {
        update.fascist = room.fascist + 1;
      }
    }
    // console.log("president veto approved");
    Rooms.update(roomId, { $set: update });
  },
  "chancellor-veto-continue" ({ roomId }) {
    let room = Rooms.findOne(roomId);
    let update = {};

    // Room resetting - chancellor veto approved, policies discarded none enacted
    update.discardpile = room.discardpile.concat(room.policychoices);
    update.vetobutton = { president: true, chancellor: true };
    update.vetoresult = { president: "", chancellor: "" };
    // regular Room resetting
    update.round = room.round + 1;
    update.policychoices = [];
    update.voted = false;
    update.votes = {};
    update.voteresult = "";
    update.currentPresident = (room.currentPresident + 1) %_.size(room.players);
    update.currentChancellor = -1;
    update.electiontracker = room.electiontracker + 1;
    update.trackerenact = { topcard: "", message: "" };

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
        // console.log("tracker at 3. drawpile:", drawpile);

      if (drawpile.length === 0) {
        drawpile = drawpile.concat(update.discardpile);
        update.discardpile = [];
          // console.log("tracker at 3. concat discard into drawpile", drawpile);
      }

      let topCard = drawpile.splice(0, 1)
      update.trackerenact = {
        topcard: topCard,
        message: `a ${topCard} policy has been enacted!`};
      update.drawpile = drawpile;
      // election tracker is reset client side "utils.js" via promise
      update.electiontracker = 0;
      if (topCard == "liberal") {
        update.liberal = room.liberal + 1;
      } else if (topCard == "fascist") {
        update.fascist = room.fascist + 1;
      }
    }
    // console.log("chancellor veto approved");
    // console.log("policychoices about to be concat to discard", room.policychoices);
    // console.log("new discardpile", update.discardpile);
    Rooms.update(roomId, { $set: update });
  },
});
