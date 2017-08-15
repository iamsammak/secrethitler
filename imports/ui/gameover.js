import { Template } from 'meteor/templating';
import { Rooms, Players } from '../api/collections.js';

import './gameover.html';

Template.gameover.helpers({
  room: function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    return room;
  },
  players: function() {
    let roomId = Session.get("roomId");
    let room = Rooms.findOne(roomId);
    return room.players;
  },
})
