var express = require("express"),
    router  = express.Router(),
    User    = require("../models/user"),
    passport = require("passport");

//root route
router.get("/", function(req, res) {
   res.render("landing") ;
});

//show register form
router.get("/register", function(req, res) {
   res.render("register", {page: 'register'}) ;
});

//handle sign up
router.post("/register", function(req, res) {
   User.register(new User({username: req.body.username}), req.body.password, function(err, user) {
      if(err) {
          console.log(err);
          return res.render("register", {"error": err.message});
      } 
      passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to YelpCamp " + user.username);
            res.redirect("/campgrounds") ;
      });
   });
});

//show login form
router.get("/login", function(req, res) {
   res.render("login", {page: 'login'}) ;
});

//handle login
router.post("/login", passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
}), function(req, res) {});

//logout route
router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Successfully logged out!");
    res.redirect("back");
});


module.exports = router;