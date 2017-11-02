var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
	username: String,
	password: String
});

UserSchema.plugin(passportLocalMongoose);		//add todos os métodos do passport ao meu Schema

module.exports = mongoose.model("User", UserSchema);