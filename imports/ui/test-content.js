import { Template } from 'meteor/templating';

import './test-content.html';

Template.content.onCreated( function() {
  let data = this.data;
  console.log("onCreated: ", data);
});

Template.content.onRendered( function() {
  let data = this.data;
  console.log("onRendered: ", data);
});

Template.content.helpers({
  exclamation: function() {
    let data = Template.instance(data);
    return "That's a lot of " + data.contentType + "!";
  }
});

Template.content.events({
  'click .list-group-item': function(event, template) {
    console.log("name: ", this.name);
    console.log("second: ", this.second);
  }
});
