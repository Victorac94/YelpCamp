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
            email: req.body.email,
            avatar: req.body.avatar
        });
    if(req.body.secretCode === "passCode1234") {
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err, user) {
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
    res.redirect("/campgrounds");
});

//SHOW - USER PROFILE
router.get("/users/:id", function(req, res) {
   User.findById(req.params.id, function(err, foundUser) {
       if(err) {
           console.log(err);
           req.flash("error", "There was an error");
           res.redirect("back");
       } else {
           Campground.find({}, function(err, foundCampgrounds) {
              if(err) {
                console.log(err);
                res.flash("error", "There was an error");
                res.redirect("back");
              } else {
                  Comment.find({}, function(err, foundComments) {
                      if(err) {
                        console.log(err);
                        res.flash("error", "There was an error");
                        res.redirect("back");
                      } else {
                        res.render("users/show", {user: foundUser, allCampgrounds: foundCampgrounds, allComments: foundComments, page: "profile"});
                      }
                  });
              }
           });
       }
   }) ;
});

//EDIT - SHOW EDIT USER
router.get("/users/:id/edit", middleware.checkProfileOwnership, function(req, res) {
    User.findById(req.params.id, function(err, foundUser) {
       if(err) {
           console.log(err);
           res.flash("error", "There was an error");
           res.redirect("/users/" + req.params.id);
       } else {
           res.render("users/edit", {user: foundUser, page: "profile"});
       }
    });
});

//UPDATE - USER PROFILE
router.put("/users/:id/edit", middleware.checkProfileOwnership, function(req, res) {
    var newData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        avatar: req.body.avatar,
        email: req.body.email,
        about: req.body.about
    }
   User.findByIdAndUpdate(req.params.id, newData, function(err, updatedUser) {
       if(err) {
           console.log(err);
           req.flash("error", "There was an error");
           res.redirect("/users/" + req.params.id);
       } else {
           req.flash("success", "Profile successfully updated!");
           res.redirect("/users/" + req.params.id);
       }
   });
});

module.exports = router;