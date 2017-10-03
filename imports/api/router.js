Router.configure({
    // options go here for templates that are to appear on every route
  trackPageView: true
});

Router.route("/", function() {
  this.render("main");
  // console.log("Hello from router");
  Session.set("view", "startmenu");
  // this is to replicate setting the view on main template creation
});

Router.route("/:accessCode", function() {
  let accessCode = this.params.accessCode;
  this.render("main");
  Session.set("accessCode", accessCode);
  Session.set("view", "joingame");
});
