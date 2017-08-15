import { Template } from 'meteor/templating';

import { Rooms, Players } from '../api/collections.js';

import './game.html';

Template.game.helpers({
  equals: function(a, b) {
    return a == b;
  },
  round: function() {
    let room = Rooms.findOne(roomId);
    return room.round;
  }
})
