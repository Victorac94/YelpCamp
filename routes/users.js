var express = require("express"),
    router  = express.Router(),
    User    = require("../models/user"),
    middleware = require("../middleware");
    
var multer = require("multer");
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require("cloudinary");
cloudinary.config({ 
  cloud_name: 'victorac', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});
    

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
router.put("/users/:id/edit", middleware.checkProfileOwnership, upload.single("avatarLocal"), function(req, res) {
    var newData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        avatar: req.body.avatar,
        email: req.body.email,
        about: req.body.about
    };
    
    //If a new image file has been uploaded
    if(req.file) {
        User.findById(req.params.id, function(err, foundUser) {
            if(err) {
                req.flash('error', err.message);
                return res.redirect('back');
            }
            //Delete the file from cloudinary if there is already one
            if(foundUser.avatarId !== ""){
                cloudinary.v2.uploader.destroy(foundUser.avatarId, function(err, result) {
                    if(err) {
                        req.flash('error', err.message);
                        return res.redirect('back');
                    } 
                    //Upload a new one
                    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
                        if(err) {
                            req.flash('error', err.message);
                            return res.redirect('back');
                        }
                        // add cloudinary url for the user's avatar
                        newData.avatar = result.secure_url;
                        // add image's public_id to users's avatar_id
                        newData.avatarId = result.public_id;
                        
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
                });
            } else {
                //Upload a new one
                cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
                    if(err) {
                        req.flash('error', err.message);
                        return res.redirect('back');
                    }
                    // add cloudinary url for the user's avatar
                    newData.avatar = result.secure_url;
                    // add image's public_id to users's avatar_id
                    newData.avatarId = result.public_id;
                    
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
            }
        });
    } else {
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
    }
    
    
       
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