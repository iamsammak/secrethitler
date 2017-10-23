import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';
import '../imports/ui/body.js';
import '../imports/api/router.js';

document.addEventListener("click", function(e) {
  if (e.target.nodeName == "LI") {
    e.target.classList.toggle("strikethrough");
  }
});
