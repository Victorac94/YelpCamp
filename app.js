var express         = require("express"), 
    app             = express(),
    bodyParser      = require("body-parser"),
    mongoose        = require("mongoose"),
    flash           = require("connect-flash"),
    passport        = require("passport"),
    LocalStrategy   = require("passport-local"),
    methodOverride  = require("method-override"),
    User            = require("./models/user"),
    seedDB          = require("./seeds");
    
    require("dotenv/config");
    
    //requiring routes
var campgroundRoutes = require("./routes/campgrounds"),
    commentRoutes    = require("./routes/comments"),
    userRoutes       = require("./routes/users"),
    indexRoutes      = require("./routes/index");
    

var url = process.env.DATABASEURL || "mongodb://localhost/yelp_camp";
mongoose.connect(url);

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(flash());
//seedDB(); //Seeds the database

//Moment.js
app.locals.moment = require('moment');

//PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: process.env.PASSPORTSECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
passport.use(new LocalStrategy(User.authenticate()));

//Middleware that runs the funcion on every ROUTE and is available on every template (view)
app.use(function(req, res, next) {
    res.locals.currentUser = req.user; // 'currentUser' is the variable which we have access to on every Route && View
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use(indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use(userRoutes);


app.listen(process.env.PORT, process.env.IP, function() {
   console.log("The YelpCamp v1 server has started!") ;
});