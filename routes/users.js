var express = require("express"),
    router  = express.Router(),
    User    = require("../models/user"),
    Campground = require("../models/campground"),
    Comment = require("../models/comment"),
    middleware = require("../middleware");
    

//SHOW - USER PROFILE
router.get("/users/:id", function(req, res) {
   User.findById(req.params.id, function(err, foundUser) {
       if(err) {
           console.log(err);
           req.flash("error", "There was an error");
           res.redirect("back");
       } else {
            res.render("users/show", {user: foundUser, campgrounds: foundUser.campgrounds, comments: foundUser.comments, page: "profile"});
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