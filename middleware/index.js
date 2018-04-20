var Comment = require("../models/comment.js");
var Campground = require("../models/campground.js");

var middleware = {};

middleware.checkCommentOwnership = function (req, res, next) {
    if(req.isAuthenticated()) {
        Comment.findById(req.params.commentId, function(err, foundComment) {
           if(err || !foundComment) {
               req.flash("error", "Could not find the comment.");
               res.redirect("back");
           } else {
               if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
                   next();
               } else {
                   req.flash("error", "You do not have permission to do that.");
                   res.redirect("back");
               }
           }
        });
    } else {
        req.flash("error", "You need to be logged in to do that!");
        res.redirect("back");
    }
}

middleware.checkCampgroundOwnership = function (req, res, next) {
    if(req.isAuthenticated()) {
        Campground.findById(req.params.id, function(err, foundCampground) {
           if(err || !foundCampground) {
               req.flash("error", "Campground not found.");
               res.redirect("back");
           } else {
               if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin) {
                   next();
               } else {
                   req.flash("error", "You do not have permission to do that.");
                   res.redirect("back");
               }
           }
        });
    } else {
        req.flash("error", "You need to be logged in.")
        res.redirect("back");
    }
}

middleware.checkProfileOwnership = function(req, res, next) {
    if(req.isAuthenticated()) {
        if(req.user._id.equals(req.params.id)) {
            next();
        } else {
            req.flash("error", "You do not have permission to do that.");
            res.redirect("/users/" + req.params.id);
        }
    } else {
        req.flash("error", "You need to be logged in.");
        res.redirect("/users/" + req.params.id);
    }
}

middleware.isLoggedIn = function (req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "You need to be logged in to do that!");
    res.redirect("back");
}

module.exports = middleware;