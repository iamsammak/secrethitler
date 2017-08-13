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
    return "j0v1an";
  },
  // or use Random.hexString(6)
  code: function createCode() {
    let code = "";
    // might consider removing caps
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 6; i++) {
      code += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return code;
  },
});
