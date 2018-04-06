var mongoose = require("mongoose");

var campgroundSchema = new mongoose.Schema({
   name: String,
   price: String,
   image: {
      type: String,
      default: "https://images.pexels.com/photos/589841/pexels-photo-589841.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
   },
   imageId: {
      type: String,
      default: ""
   },
   description: String,
   location: String,
   lat: Number,
   lng: Number,
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
   comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
      }
      ]
});

module.exports = mongoose.model("Campground", campgroundSchema);