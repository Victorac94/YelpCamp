var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var User    = require("../models/user");
var Comment = require("../models/comment");

var multer  = require("multer");
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

require("dotenv/config");

//Como hemos creado el archivo del middleware con el nombre 'index.js' aqui solo hace falta
//requerir la carpeta padre. Ya que haciendo eso siempre busca el archivo que se llame 'index.'
var middleware = require("../middleware");

var NodeGeocoder = require('node-geocoder');
var faker = require("faker");
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

//INDEX - show all campgrounds
router.get("/", function(req, res) {
    if(req.query.search && req.query.search !== '') {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({name: regex}, function(err, foundCampgrounds) {
            if(err) {
                console.log(err);
                req.flash("error", "There was an error, couldn't find any campground.");
                res.redirect("back");
            } else {
                res.render("campgrounds/index", {list: foundCampgrounds, page: 'campgrounds', searchString: regex});   
            }
        });
    } else {
        //Get all campgrounds from the DB
        Campground.find({}, function(err, allCampgrounds) {
           if(err) {
               console.log(err);
           } else  {
               res.render("campgrounds/index", {list: allCampgrounds, page: 'campgrounds'}) ;
           }
        });
    }
});

//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res) {
   res.render("campgrounds/new", {googleApiKey: process.env.GOOGLEAPIKEY}) ;
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single("localImage"), function(req, res) {
    // get data from form and add to campgrounds array
    var name = req.body.name;
    var price = req.body.price;
    var image = req.body.image;
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    };
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || data.status === 'ZERO_RESULTS') {
            console.log(err);
            console.log(data);
            req.flash('error', 'Invalid address, try typing a new address');
            return res.redirect('back');
        }
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        var location = data[0].formattedAddress;
        // Create a new campground and save to DB
        var newCampground = {
            name: name,
            price: price,
            description: desc,
            author: author, 
            location: location, 
            lat: lat, 
            lng: lng
        };
        
        //If a new image file has been uploaded
        if(req.file) {
            cloudinary.uploader.upload(req.file.path, function(result) {
                // add cloudinary url for campground's image
                newCampground.image = result.secure_url;
                // add image's public_id to campground's imageId
                newCampground.imageId = result.public_id;
                
                //Create a new campground and save to DB
                Campground.create(newCampground, function(err, newlyCreated) {
                    if(err) {
                        console.log(err);
                        req.flash("error", "There was an error");
                        res.redirect("back");
                    } else {
                        User.findById(req.user._id, function(err, foundUser) {
                            if (err) console.log(err) ;
                            else {
                                foundUser.campgrounds.push(newlyCreated);
                                foundUser.save(function(err, savedUser) {
                                    if(err) console.log(err);
                                });
                            }
                        });
                        req.flash("success", "Added new Campground!");
                        res.redirect("/campgrounds");
                    }
                });
            }); 
        } else {
            // Check if the user provided an url for the campground picture
            // If not the campground will have a default picture (already set in the campground Schema)
            if(image !== "") {
                newCampground.image = image;
            }
            Campground.create(newCampground, function(err, newlyCreated) {
                if(err) {
                    console.log(err);
                    req.flash("error", "There was an error");
                    res.redirect("back");
                } else {
                    User.findById(req.user._id, function(err, foundUser) {
                        if (err) console.log(err) ;
                        else {
                            foundUser.campgrounds.push(newlyCreated);
                            foundUser.save(function(err, savedUser) {
                                if(err) console.log(err);
                            });
                        }
                    });
                    req.flash("success", "Added new Campground!");
                    res.redirect("/campgrounds");
                }
            });
        }
    });
});

//NEW RANDOM - show form with random prefilled data
router.get("/new/random", middleware.isLoggedIn, function(req, res) {
    var random = {};
    random.name = faker.random.word() + " " + faker.random.word();
    random.price = faker.commerce.price();
    random.img = "https://source.unsplash.com/800x600/?nature";
    random.desc = faker.lorem.paragraph();
    random.place = faker.address.country();
    
    res.render("campgrounds/new-random", {random: random, googleApiKey: process.env.GOOGLEAPIKEY});
});

//SHOW - shows more info about one campground
router.get("/:id", function(req, res) {
    //find the campground with provided id
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
       if(err || !foundCampground){
           console.log(err);
           req.flash("error", "Sorry, that Campground does not exist.");
           res.redirect("/campgrounds");
       } else {
           //render show template with that campground
           res.render("campgrounds/show", {camp: foundCampground, googleApiKey: process.env.GOOGLEAPIKEY});
       }
    });
});

//EDIT - shows the edit form
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
    Campground.findById(req.params.id, function(err, foundCampground) {
       if(err) {
        console.log(err);
       } else {
           res.render("campgrounds/edit", {campground: foundCampground, googleApiKey: process.env.GOOGLEAPIKEY});
       }
    });
});

//UPDATE - handles the campground update
router.put("/:id", middleware.checkCampgroundOwnership, upload.single("localImage"), function(req, res) {
    geocoder.geocode(req.body.campground.location, function (err, data) {
        if (err || !data.length) {
            console.log(err);
            req.flash('error', 'Invalid address');
            return res.redirect('back');
        }
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        var location = data[0].formattedAddress;
        var newData = {
            name: req.body.campground.name, 
            image: req.body.campground.image, 
            description: req.body.campground.description, 
            cost: req.body.campground.cost, 
            location: location, 
            lat: lat, 
            lng: lng
        };
        
        
        // if a new image file has been uploaded
        if (req.file) {
            Campground.findById(req.params.id, function(err, campground) {
                if(err) {
                    req.flash('error', err.message);
                    return res.redirect('back');
                }
                // delete the file from cloudinary if there is already one
                if(campground.imageId !== "") {
                    cloudinary.v2.uploader.destroy(campground.imageId, function(err, result){
                        if(err) {
                            req.flash('error', err.message);
                            return res.redirect('back');
                        }
                        // upload a new one
                        cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
                            if(err) {
                                req.flash('error', err.message);
                                return res.redirect('back');
                            }
                            // add cloudinary url for the image to the campground object under image property
                            newData.image = result.secure_url;
                            // add image's public_id to campground object
                            newData.imageId = result.public_id;
            
                            Campground.findByIdAndUpdate(req.params.id, newData, function(err) {
                                if(err) {
                                    console.log(err); 
                                    req.flash("error", "Something went wrong. Could not complete the action.");
                                    res.redirect("back");
                                } else {
                                    req.flash("success", "Campground updated!");
                                    res.redirect("/campgrounds/" + req.params.id);
                                }
                            });
                        });
                    });
                } else {
                    // upload a new one
                    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
                        if(err) {
                            req.flash('error', err.message);
                            return res.redirect('back');
                        }
                        // add cloudinary url for the image to the campground object under image property
                        newData.image = result.secure_url;
                        // add image's public_id to campground object
                        newData.imageId = result.public_id;
        
                        Campground.findByIdAndUpdate(req.params.id, newData, function(err) {
                            if(err) {
                                console.log(err); 
                                req.flash("error", "Something went wrong. Could not complete the action.");
                                res.redirect("back");
                            } else {
                                req.flash("success", "Campground updated!");
                                res.redirect("/campgrounds/" + req.params.id);
                            }
                        });
                    });
                }
            });
        } else {
            Campground.findByIdAndUpdate(req.params.id, newData, function(err, updatedCampground) {
                if(err) {
                    console.log(err); 
                    req.flash("error", "Something went wrong. Could not complete the action.");
                    res.redirect("back");
                } else {
                    req.flash("success", "Campground updated!");
                    res.redirect("/campgrounds/" + req.params.id);
                }
            });
        }
    });
});

//DESTROY - remove a specific campground
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res) {
        
    // DELETE CORRESPONDING COMMENTS FROM THE USER MODEL
    new Promise (function(resolve, reject) {
        Campground.findById(req.params.id, function(err, foundCampground) {
            if(err) return console.log(err) ;
           
            // Look for every comment the selected Campground has
            for(var i = 0; i < foundCampground.comments.length; i++) {
                var commentId = foundCampground.comments[i];
               
                Comment.findById(commentId, function(err, foundComment) {
                    if(err) return console.log(err);
                    
                    // Look for the author's ID of each comment found
                    User.findById(foundComment.author.id, function(err, foundUser){
                        if(err) return console.log("There was an error: " + err);
                        
                        console.log("This is outside of forEach: " + foundUser.comments);
                        
                        // Look for every comment the author has posted on any campground
                        for(var t = 0; t < foundUser.comments.length; t++) {
                            var comment = foundUser.comments[t];
                            
                            console.log("This is inside of forEach: " + foundUser.comments);
                            
                            // Check if the comment from the current user we're iterating belongs to the current campground
                            if(foundComment._id.equals(comment._id)) {
                                console.log("The ID's are the same: " + foundComment._id + " AND " + comment._id);
                                
                                // If so delete that comment from that user
                                User.findByIdAndUpdate(foundUser._id, {$pull: {comments: {_id: comment._id}, campgrounds: {_id: foundCampground._id}}}, function(err) {
                                    if(err) reject(console.log("The find and Update didn't quite work"));
                                });
                                //if we delete the comment from the foundUser.comments array then break this loop and 
                                //look for the next comment in the campground
                                break;
                            } else {
                                console.log("ID'S DO NOT MATCH; FIRST: " + foundComment._id + " SECOND: " + comment._id);
                            }
                        }
                        
                    });
                });
            }
            if(foundCampground.comments.length === 0) {
                User.findByIdAndUpdate(foundCampground.author.id, {$pull: {campgrounds: {_id: foundCampground._id}}}, function(err) {
                    if(err) reject(console.log("The find and Update (for no-comments) didn't quite work"));
                });
            }
            resolve();
        });
        
    }).then(function() {    // DELETE COMMENTS FROM DB THAT BELONG TO THE CAMPGROUND WE WANT TO DELETE
        Campground.findById(req.params.id, function(err, foundCampground) {
            if(err) return console.log(err) ;
            
            foundCampground.comments.forEach((commentId) => {
                Comment.findByIdAndRemove(commentId, function(err) {
                    if(err) return console.log("There was an error: " + err);
                    console.log("Comment deleted!");
                });
            });
            // If campground has an image uploaded from a local storage
            if(foundCampground.imageId !== "") {
                cloudinary.v2.uploader.destroy(foundCampground.imageId, function(err, result) {
                    if(err) {
                        console.log(err);
                        req.flash('error', "There was an error");
                        return res.redirect('back');
                    }
                });
            }
        });
        return;
        
    }).then(function() {    // DELETE THE CAMPGROUND
        Campground.findByIdAndRemove(req.params.id, function(err) {
            if(err) {
                  console.log(err);
                  req.flash("error", "Something went wrong. Could not complete the action.");
                  res.redirect("back");
            } else {
                req.flash("success", "Campground deleted!");
                res.redirect("/campgrounds");
            }
        }) ;
        
    }).catch(function(error) {  // CATCH ANY ERRORS
        console.log("This is the .catch() " + error);
    });
});


function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;