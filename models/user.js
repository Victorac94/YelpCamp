var mongoose            = require("mongoose"),
passportLocalMongoose   = require("passport-local-mongoose"),
Comment                 = require("./comment.js"),
commentSchema           = mongoose.model("Comment").schema,
Campground              = require("./campground.js"),
campgroundSchema        = mongoose.model("Campground").schema;


var UserSchema = new mongoose.Schema({
    username: {type: String, unique: true, required: true}, 
    password: String,
    firstName: String,
    lastName: String,
    email: {type: String, unique: true, required: true},
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    bio: String,
    avatar: {
        type: String,
        default: "https://cdn.pixabay.com/photo/2017/07/18/23/23/user-2517433_960_720.png"
    },
    isAdmin: {type: Boolean, default: false}, 
    comments: [commentSchema],
    campgrounds: [campgroundSchema]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);