//TODO TO BE DELETED

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
    update.policychoices = [];
  } else if (type == "investigate") {
    update.investigate = false;
    update.reveal = false;
    update.suspects = [];
    update.suspected = [];
  }

  if ((type == "peek" || type == "investigate") || (_.size(update.votes) == 0)) {
    update.round = room.round + 1;
    update.voted = false;
    update.votes = {};
    update.voteresult = "";
    update.ruledout = [
      room.players[room.currentPresident].playerId,
      room.players[room.currentChancellor].playerId];
    update.currentPresident = (room.currentPresident + 1) % _.size(room.players);
    update.currentChancellor = -1;
    update.executiveaction = "inactive";
  }

  Rooms.update(player.roomId, { $set: update });
},
