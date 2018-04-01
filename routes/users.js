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

//EDIT - SHOW CHANGE PASSWORD
router.get("/users/:id/changePassword", middleware.checkProfileOwnership, function(req, res) {
    User.findById(req.params.id, function(err, foundUser) {
        if(err) console.log(err);
       res.render("users/changePassword", {user: foundUser}) ; 
    });
});

//UPDATE - CHANGE USER PASSWORD
router.put("/users/:id/changePassword", middleware.checkProfileOwnership, function(req, res) {
    if(req.body.password === req.body.confirm) {
        User.findById(req.params.id, function(err, foundUser) {
            if(err) console.log(err);
            foundUser.setPassword(req.body.password, function(err) {
               if(err) {
                   console.log(err);
                   req.flash("error", "There was an error. Try again.");
                   res.redirect("back");
               } else {
                   foundUser.save(function(err) {
                      if(err) console.log(err);
                      else {
                          req.flash("success", "Password updated!");
                          res.redirect("/users/" + req.params.id);
                      }
                   });
               }
            });
        });
    } else {
        req.flash("error", "Passwords do not match.");
        res.redirect("back");
    }
});

module.exports = router;