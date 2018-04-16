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
        };
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
    new Promise (function(resolve, reject) {
        Comment.findByIdAndUpdate(req.params.commentId, req.body.comment, function(err, updatedComment) {
            if(err) {
                console.log(err);
                req.flash("error", "Could not update the comment.");
                return res.redirect("back");
            } else {
                req.flash("success", "Comment updated!");
                res.redirect("/campgrounds/" + req.params.id);
            }
            resolve();
        }) ;
    }).then(function() {
        User.findById(req.user._id, function(err, foundUser) {
          if(err) console.log("The find and Update didn't work in router.put");
          var subDoc = foundUser.comments.id(req.params.commentId);
          subDoc.set(req.body.comment);
          foundUser.save(function(err) {
              if(err) return console.log(err);
              return;
          });
        });
    }).catch(function(error) { // CATCH ANY ERRORS
       console.log("This is the .catch from router.put: " + error) ;
    });
    
});

//DESTROY - Comment
router.delete("/:commentId", middleware.checkCommentOwnership, function(req, res) {
    new Promise (function(resolve, reject) {
        // DELETE CORRESPONDING COMMENT FROM THE USER MODEL
        User.findByIdAndUpdate(req.user._id, {$pull: {comments: {_id: req.params.commentId}}}, function(err) {
            if(err) reject(console.log("The find and Update didn't quite work"));
            resolve();
        });
    }).then(function() {    // DELETE THE COMMENT FROM THE CAMPGROUND MODEL
        Campground.findByIdAndUpdate(req.params.id, {$pull: {comments: req.params.commentId}}, function(err) {
            if(err) return console.log(err) ;
        });
        return;
    }).then(function() {    // DELETE THE COMMENT FROM THE COMMENT MODEL
        Comment.findByIdAndRemove(req.params.commentId, function(err) {
            if(err) {
                  console.log(err);
                  req.flash("error", "Something went wrong. Could not complete the action.");
                  res.redirect("back");
            } else {
                req.flash("success", "Comment deleted!");
                res.redirect("/campgrounds/" + req.params.id);
            }
        });
        
    }).catch(function(error) {  // CATCH ANY ERRORS
        console.log("This is the .catch() " + error);
    });
});


module.exports = router;