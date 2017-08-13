import { Template } from 'meteor/templating';

import './newgame.html';

Template.newgame.events({
  "click .back-btn": function() {
    Session.set("view", "startmenu");
  },
  "submit #newgame-form": function(event) {
    event.preventDefault();

    console.log(event);
    let name = event.target.name.value;
    console.log("Hello", name);
    console.log("add subscription to room and change view to lobby");
  }
});
