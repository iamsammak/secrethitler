import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import Utils from './utils.js';
import { Rooms, Players } from '../imports/api/collections.js';

Meteor.methods({
  "pickchancellor" ({ playerId }) {
    let player = Players.findOne(playerId);
    // console.log("test", player);
    // console.log("inside pickchancellor", player.index);
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
      // switch off flash message logic here
      Rooms.update(player.roomId, {
        $set: {
          currentChancellor: player.index,
          loudspeaker: false
        }
      });
    }
  },
  "vote" ({ playerId, vote}) {
    let player = Players.findOne(playerId);
    let room = Rooms.findOne(player.roomId);
    let update = { votes: room.votes };

    // attempt to stop the extra vote method.call (Update known cause: double click on vote button)
    // if playerId already exists then return
    if (playerId in update.votes) {
      return;
    }

    update.votes[playerId] = vote;
    // console.log(`player: ${player.name}, vote: ${vote}`);

    // once everyone has voted on the executive branch
    if (_.size(update.votes) === room.alive) {
      update.voted = true;
      update.voteresult = _.countBy(_.values(update.votes), (value) => {
        return value ? "true" : "false";
      }).true > (room.alive / 2) ? "pass" : "fail";

      // voting is a pass
      if (update.voteresult === "pass") {
        update.electiontracker = 0;
        if (room.policychoices != 0) {
          console.log("WHY IS THERE SOMETHING IN HERE", room.policychoices);
        }
        let policychoices = room.policychoices; //should be [];
        // console.log("policychoices should be empty", room.policychoices);
        let drawpile = room.drawpile;
        // console.log(`voteresult: ${update.voteresult}, policychoices`, policychoices);
        if (room.fascist >= 3 && room.players[room.currentChancellor].role == "hitler") {
          update.state = "gameover";
          update.winner = "fascists";
          update.reason = "hitler has been elected!";
          update.players = room.players;
        } else {
          // shuffle discardpile into drawpile if drawpile is below 3
          // console.log(`drawpile:`, drawpile);
          if (drawpile.length < 3 && policychoices.length == 0) {
            let remaining = drawpile.length;
            let fillToThree = 3 - remaining;

            policychoices = policychoices.concat(drawpile.splice(0, remaining));
            // console.log(`splice to remaining`, policychoices);
            drawpile = drawpile.concat(room.discardpile);
            // console.log("concat discard into drawpile", drawpile);
            update.discardpile = [];
            _.shuffle(drawpile);

            policychoices = policychoices.concat(drawpile.splice(0, fillToThree));
            // console.log(`policychoices after fillToThree`, policychoices);
          } else if (drawpile.length >= 3) {
            if (policychoices.length == 0) {
              policychoices = drawpile.splice(0, 3);
            } else if (policychoices.length != 0) {
              // console.log("special case. policychoices.length =", policychoices.length);
              newdrawpile = [];
              newdrawpile = newdrawpile.concat(policychoices).concat(drawpile);
              drawpile = newdrawpile;
              policychoices = drawpile.splice(0, 3);
            }
            // console.log("draw three from the deck", policychoices);
          }

          update.drawpile = drawpile;
          update.policychoices = policychoices;
        }

      // voting was a fail
      } else if (update.voteresult == "fail") {
        // reset trackerenact.message so flashmessage doesn't go off
        update.trackerenact = { topcard: "", message: "" };

        update.electiontracker = room.electiontracker + 1;

        // enact top policy if election tracker is at 3
        if (update.electiontracker == 3) {
          let drawpile = room.drawpile;
          // console.log("tracker at 3. drawpile:", drawpile);
          if (drawpile.length == 0) {
            drawpile = drawpile.concat(room.discardpile);
            update.discardpile = [];
            // console.log("tracker at 3. concat discard into drawpile", drawpile);
          }

          let topCard = drawpile.splice(0, 1);

          update.drawpile = drawpile;
          update.trackerenact = {
            topcard: topCard,
            message: `a ${topCard} policy has been enacted!`
          };
        }
      }
    }

    // TODO testing veto
    if (room.fascist >= 5) { //TODO change back == 5
      update.vetobutton = { president: true, chancellor: true };
    } else {
      update.vetobutton = { president: false, chancellor: false };
    }

    Rooms.update(player.roomId, {
      $set: update
    });
    // console.log("vote", update);
  },
  "votecontinue" ({ playerId }) {
    let player = Players.findOne(playerId);
    if (!player) {
      return;
    }
    let room = Rooms.findOne(player.roomId);
    let update = {};

    // console.log("vote failed, continue");
    update.votes = room.votes
    delete update.votes[playerId]

    // room resetting - after a vote failed
    if (_.size(update.votes) == 0) {
// console.log("vote continue, votes", update.votes);
      update.round = room.round + 1;
      update.voted = false;
      update.votes = {};
      update.voteresult = "";
      update.currentChancellor = -1;

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

      // last player to press vote-failed's continue button will trigger this
      if (room.electiontracker === 3) {
        update.electiontracker = 0;
        if (room.trackerenact.topcard == "liberal") {
          update.liberal = room.liberal + 1;
        } else if (room.trackerenact.topcard == "fascist") {
          update.fascist = room.fascist + 1;
        }
        // flash message - I still might just cut this out
        update.loudspeaker = true;
      }
    }
    // console.log("vote continue", update);
    Rooms.update(player.roomId, { $set: update });
  },
});
