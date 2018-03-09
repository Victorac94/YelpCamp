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
               if(foundComment.author.id.equals(req.user._id)) {
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
               if(foundCampground.author.id.equals(req.user._id)) {
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

// middleware.checkUserCampground = function(req, res, next){
//     Campground.findById(req.params.id, function(err, foundCampground){
//       if(err || !foundCampground){
//           console.log(err);
//           req.flash('error', 'Sorry, that campground does not exist!');
//           res.redirect('/campgrounds');
//       } else if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin){
//           req.campground = foundCampground;
//           next();
//       } else {
//           req.flash('error', 'You don\'t have permission to do that!');
//           res.redirect('/campgrounds/' + req.params.id);
//       }
//     });
//   }
  
// middleware.checkUserComment = function(req, res, next){
//     Comment.findById(req.params.commentId, function(err, foundComment){
//       if(err || !foundComment){
//           console.log(err);
//           req.flash('error', 'Sorry, that comment does not exist!');
//           res.redirect('/campgrounds');
//       } else if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
//             req.comment = foundComment;
//             next();
//       } else {
//           req.flash('error', 'You don\'t have permission to do that!');
//           res.redirect('/campgrounds/' + req.params.id);
//       }
//     });
//   }

middleware.isLoggedIn = function (req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "You need to be logged in to do that!");
    res.redirect("/login");
}

module.exports = middleware;