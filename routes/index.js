var express     = require("express"),
    router      = express.Router(),
    passport    = require("passport"),
    User        = require("../models/user"),
    Campground  = require("../models/campground"),
    nodemailer  = require("nodemailer"),
    crypto      = require("crypto");
    
//SETUP VARS FOR MAILGUN PASSWORD RESET
var api_key = 'key-ee94626096513ee20bd578d74306ea27';
var domain = 'sandbox2b24dacbc1bb419aac6c9461525c45cc.mailgun.org';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

 

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

//forgot password
router.get("/forgot", function(req, res) {
   res.render("forgot") ;
});

router.post("/forgot", function(req, res, next) {
   async.waterfall([
       function(done) {
           crypto.randomBytes(20, function(err, buf) {
              if(err) console.log(err);
              else {
                  var token = buf.toString("hex");
                  done(err, token);
              }
           });
       },
       function(token, done) {
           User.findOne({email: req.body.email}, function(err, user) {
              if(err || !user) {
                  console.log(err);
                  req.flash("error", "No account with that user email exists");
                  return res.redirect("/forgot");
              } else {
                  user.resetPasswordToken = token;
                  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
                  
                  user.save(function(err) {
                      if(err) console.log(err);
                      
                      done(err, token, user);
                  });
              }
           });
       },
        function(token, user, done) {
            var mailOptions = {
              from: 'YelpCamp <victorac94@hotmail.com>',
              to: user.email,
              subject: 'YelpCamp Password Reset',
              text: "You are receiving this because you (or someone else) have requested the reset of the password. " + 
                  "Please click on the following link, or paste this into your browser to complete the process\n\n" + 
                  "https://webdevbootcamp-victorac94.c9users.io/reset/" + token + "\n\n" + 
                  "If you did not request this, please ignore this email and your password will remain unchanged."
            };
             
            mailgun.messages().send(mailOptions, function (err, body) {
                if(err) {
                    console.log(err);
                    return;
                }
              req.flash("success", "An email has been sent to " + user.email + " with further instructions.");
              done(err, "done");
            });
        }
       ], function(err) {
           if(err) return next(err);
           res.redirect("/forgot");
       }); 
});

router.get("reset/:token", function(req, res) {
   User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now() }}, function(err, foundUser) {
       if(err) console.log(err);
       if(!foundUser) {
            req.flash("error", "Password reset token is invalid or has expired");
            return res.redirect("/forgot");
       }
       res.render("reset", {token: req.params.token});
   }) ;
});

router.post("reset/:token", function(req, res) {
    async.waterfall([
        function(done) {
            User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user) {
               if(err) console.log(err);
               if(!user)  {
                   req.flash("error", "Password reset token is invalid or has expired");
                   return res.redirect("back");
               }
               if(req.body.password === req.body.confirm) {
                   user.setPassword(req.body.password, function(err) {
                       if(err) console.log(err);
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;
                        
                        user.save(function(err) {
                            if(err) console.log(err);
                           req.logIn(user, function(err) {
                               done(err, user);
                           }) ;
                        });
                   });
               } else {
                   req.flash("error", "Passwords do not match");
                   return res.redirect("back");
               }
            });
        }, 
        function(user, done) {
            var mailOptions = {
              from: 'YelpCamp <victorac94@hotmail.com>',
              to: user.email,
              subject: 'Your password has been changed',
              text: "Hello,\n\n" + 
                "This is a confirmation that the password for your account " + user.email + " has been changed."
            };
             
            mailgun.messages().send(mailOptions, function (err, body) {
                if(err) {
                  console.log(err);
                  req.flash("error", "There was an error. The confirmation email could not be sent.");
                  res.redirect("/forgot");
              } else {
                  req.flash("success", "Success your password has been changed!");
                  done(err);
              }
            });
        }
        ], function(err) {
            if(err) console.log(err);
            res.redirect("/campgrounds");
        });
});


module.exports = router;