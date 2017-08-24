import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import Utils from './utils.js';
import { Rooms, Players } from '../imports/api/collections.js';

Meteor.methods({
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
  "vote" ({ playerId, vote}) {
    let player = Players.findOne(playerId);
    let room = Rooms.findOne(player.roomId);
    let update = { votes: room.votes };

    update.votes[playerId] = vote;

    // once everyone has voted on the executive branch
    if (_.size(update.votes) === room.alive) {
      update.voted = true;
      update.voteresult = _.countBy(_.values(update.votes), (value) => {
        return value ? "true" : "false";
      }).true > (room.alive / 2) ? "pass" : "fail";

      // voting is a pass
      if (update.voteresult === "pass") {
        update.electiontracker = 0;
        let policychoices = [];
        let drawpile = room.drawpile;

        if (room.fascist >= 3 && room.players[room.currentChancellor].role == "hitler") {
          update.state = "gameover";
          update.winner = "fascists";
          update.reason = "hitler has been elected!";
          update.players = room.players;
        } else {
          // shuffle discardpile into drawpile if drawpile is below 3
          if (drawpile.length < 3) {
            let remaining = drawpile.length;
            let fillToThree = 3 - remaining;

            policychoices = policychoices.concat(drawpile.splice(0, remaining));
            drawpile = drawpile.concat(room.discardpile);
            update.discardpile = [];
            _.shuffle(drawpile);

            policychoices = policychoices.concat(drawpile.splice(0, fillToThree));

          } else {
            policychoices = drawpile.splice(0, 3);
          }

          update.drawpile = drawpile;
          update.policychoices = policychoices;
        }

      // voting was a fail
      } else {
        // reset trackerenact.message so flashmessage doesn't go off
        update.trackerenact = { topcard: "", message: "" };
        
        update.electiontracker = room.electiontracker + 1;

        // enact top policy if election tracker is at 3
        if (update.electiontracker == 3) {
          let drawpile = room.drawpile;

          if (drawpile.length == 0) {
            drawpile = drawpile.concat(room.discardpile);
            update.discardpile = [];
          }

          let topCard = drawpile.splice(0, 1);

          update.drawpile = drawpile;
          update.trackerenact = {
            topcard: topCard,
            message: `a ${topCard} policy has been enacted!`
          };
          // election tracker is reset client side "utils.js" via promise
        }
      }
    }

    // TODO testing veto
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
  "votecontinue" ({ playerId }) {
    let player = Players.findOne(playerId);
    if (!player) {
      return;
    }
    let room = Rooms.findOne(player.roomId);
    let update = {};

    console.log("vote failed, continue");
    update.votes = rooms.votes
    delete update.votes[playerId]

    // room resetting - after a vote failed
    if (_.size(update.votes) == 0) {
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

      // why was this here, commenting out for now
      // if (type == "fail") {
      //   update.ruledout = room.ruledout;
      // }

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
    console.log("vote continue", update);
  },
});
