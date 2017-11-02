var express 	            = require("express"),
	app 		            = express(),
    passport                = require("passport"),
	bodyParser             	= require("body-parser"),
	mongoose 	            = require("mongoose"),
    moment                  = require('moment'),
    async                   = require('async'),
    request                 = require('request'),
    schedule                = require('node-schedule'),
    webSocket               = require('websocket').server,
    http                    = require('http'),
    https                   = require('https'),
    fs                      = require('fs'),
    User                    = require("./models/user"),
    localStrategy           = require("passport-local"),
    passportLocalMongoose   = require("passport-local-mongoose");


//DataBase connect
mongoose.connect("mongodb://localhost/prototipo");

//Mongo Schema
var temperaturaDHTSchema = new mongoose.Schema({
    value: String,
    created: {type: Date, default: Date.now}
});

var umidadeDHTSchema = new mongoose.Schema({
    value: String,
    created: {type: Date, default: Date.now}
});

var pressaoBMPSchema = new mongoose.Schema({
    value: String,
    created: {type: Date, default: Date.now}
});

var temperaturaBMPSchema = new mongoose.Schema({
    value: String,
    created: {type: Date, default: Date.now}
});

var umidadeSoloSchema = new mongoose.Schema({
    value: String,
    created: {type: Date, default: Date.now}
});

var scheduleIrrigacaoSchema = new mongoose.Schema({
    horario: String
});

//Mongo Model
var temperaturaDHT = mongoose.model("TemperaturaDHT", temperaturaDHTSchema);
var umidadeDHT = mongoose.model("UmidadeDHT", umidadeDHTSchema);
var pressaoBMP = mongoose.model("PressaoBMP", pressaoBMPSchema);
var temperaturaBMP = mongoose.model("TemperaturaBMP", temperaturaBMPSchema);
var umidadeSolo = mongoose.model("UmidadeSolo", umidadeSoloSchema);
var scheduleIrrigacao = mongoose.model("ScheduleIrrigacao", scheduleIrrigacaoSchema);

//RESTful routes
app.get("/",function(req, res){
	temperaturaDHT.find({
                created: {
                    //Busco dados da última hora
                    $gte: moment().subtract(1, "hours"),
                    $lt: moment()
                }
                },function(err, dados){
                if(err){
                    res.send("Erro ao buscar última temperatura DHT!!");
                }else{
                    if(dados.length == 0){
                        //banco está vazio
                        callback(null, undefined);
                    }else{
                        var temperaturaAtual = dados[dados.length -1]; //ultima temperatura registrada
                        var temperaturaUltimaHora = dados[0]; //vetor de dados vai da ultima data até a primeira
                        var data = {
                            temperaturaAtual: temperaturaAtual,
                            temperaturaUltimaHora: temperaturaUltimaHora
                        }
                        res.send(data);
                    }
                }
            })
        
});

//Web Server Listen para o Dashboard HTTP
app.listen(80, function(){
    console.log("\n***********************************");
    console.log("Servidor rodando...");
}); 

