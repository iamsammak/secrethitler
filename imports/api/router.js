Router.configure({
    // options go here for templates that are to appear on every route
});

Router.route("/", function() {
  this.render("main");
  console.log("Hello from router");
  Session.set("view", "startmenu");
  // view session was created with main.onCreated() in body.js
});

Router.route("/:accessCode", function() {
  let accessCode = this.params.accessCode;
  this.render("main");
  Session.set("accessCode", accessCode);
  Session.set("view", "joingame");
});
