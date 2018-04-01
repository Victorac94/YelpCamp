var express = require("express");
var router  = express.Router({mergeParams: true});
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var User    = require("../models/user");
//Como hemos creado el archivo del middleware con el nombre 'index.js' aqui solo hace falta
//requerir la carpeta padre. Ya que haciendo eso siempre busca el archivo que se llame 'index.'
var middleware = require("../middleware");

//NEW - Comment
router.get("/new", middleware.isLoggedIn, function(req, res) {
    Campground.findById(req.params.id, function(err, foundCampground) {
        if(err || !foundCampground) {
            console.log(err);
            req.flash("error", "Could not find the Campground.");
            res.redirect("/campgrounds");
        } else {
            res.render("comments/new", {campground: foundCampground});   
        } 
    });
});

//CREATE - Comment
router.post("/", middleware.isLoggedIn, function(req, res) {
   //Find campground using ID
   Campground.findById(req.params.id, function(err, foundCampground) {
      if(err || !foundCampground) {
          console.log(err);
          req.flash("error", "Could not find the Campground.");
          res.redirect("/campgrounds");
      }
      else {
        var newComment = {
            text: req.body.comment,
            author: {
                id: req.user._id,
                username: req.user.username
            },
            campground: req.params.id
        }
        Comment.create(newComment, function(err, createdComment) {
           if(err) {
               console.log(err);
               req.flash("error", "Something went wrong.");
               res.redirect("back");
           }
           else {
               //Add created comment to User model
               User.findById(req.user._id, function(err, foundUser) {
                  if(err) {
                      console.log(err);
                      req.flash("error", "There was an error");
                      res.redirect("back");
                  } else {
                      foundCampground.comments.push(createdComment._id);
                      foundCampground.save();
                      
                      foundUser.comments.push(createdComment);
                      foundUser.save(function(err, savedUser) {
                          if(err) console.log(err);
                      });
                      req.flash("success", "Successfully added comment!");
                      res.redirect("/campgrounds/" + req.params.id);
                  }
               });
           }
        });
      }
   });
});

//EDIT - Comment
router.get("/:commentId/edit", middleware.checkCommentOwnership, function(req, res) {
    Comment.findById(req.params.commentId, function(err, foundComment) {
        if(err) {
            console.log(err);
        } else {
            res.render("comments/edit", {campgroundId: req.params.id, comment: foundComment});
        }
    });
});

//UPDATE - Comment
router.put("/:commentId", middleware.checkCommentOwnership, function(req, res) {
   Comment.findByIdAndUpdate(req.params.commentId, req.body.comment, function(err, updatedComment) {
       if(err) {
           console.log(err);
           req.flash("error", "Could not update the comment.");
           return res.redirect("back");
       } else {
           req.flash("success", "Comment updated!");
           res.redirect("/campgrounds/" + req.params.id);
       }
   }) ;
});

//DESTROY - Comment
router.delete("/:commentId", middleware.checkCommentOwnership, function(req, res) {
   Comment.findByIdAndRemove(req.params.commentId, function(err) {
       if(err) {
           console.log(err);
           req.flash("error", "Something went wrong. Could not delete the comment.");
           return res.redirect("back");
       }
       req.flash("success", "Comment deleted!");
       res.redirect("/campgrounds/" + req.params.id);
   });
});


module.exports = router;