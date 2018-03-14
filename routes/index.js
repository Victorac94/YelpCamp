var express = require("express"),
    router  = express.Router(),
    User    = require("../models/user"),
    Campground = require("../models/campground"),
    Comment = require("../models/comment"),
    passport = require("passport"),
    middleware = require("../middleware");

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
    var newUser = new User({
            username: req.body.username,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email
        });
    if(req.body.secretCode === "passCode1234") {
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err, user) {
        if(err) {
            console.log(err);
            return res.render("register", {"error": err.message});
        } 
        if(req.body.avatar != "") {
            user.avatar = req.body.avatar;
            user.save();
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
    res.redirect("/campgrounds");
});


module.exports = router;