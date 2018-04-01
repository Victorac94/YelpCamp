var mongoose = require("mongoose"),
Campground = require("./campground.js"),
campgroundSchema = mongoose.model("Campground").schema;

var commentSchema = mongoose.Schema({
   text: String,
   createdAt: {
      type: Date,
      default: Date.now
   },
   author: {
      id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      },
      username: String
   },
   campground: String
});

module.exports = mongoose.model("Comment", commentSchema);