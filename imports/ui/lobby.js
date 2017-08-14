import { Template } from 'meteor/templating';

import './lobby.html';

Template.lobby.helpers({
  players: function() {
    // temp
    return ["a", "b", "c", "d", "e"];
  },
  room: function() {

  },
  tempCode: function() {
    return "j3r3my";
  },
});
