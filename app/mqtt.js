//Insere os dados do mqtt no mongo
var     mongoose 	= require("mongoose"),
	    mqtt		= require('mqtt');
	    
	    
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

//Mongo Model
var temperaturaDHT = mongoose.model("TemperaturaDHT", temperaturaDHTSchema);
var umidadeDHT = mongoose.model("UmidadeDHT", umidadeDHTSchema);
var pressaoBMP = mongoose.model("PressaoBMP", pressaoBMPSchema);
var temperaturaBMP = mongoose.model("TemperaturaBMP", temperaturaBMPSchema);
var umidadeSolo = mongoose.model("UmidadeSolo", umidadeSoloSchema);


//MQTT client

// /prototipo/temperaturaDHT 27.4
// /prototipo/umidadeDHT 20.7
// /prototipo/pressaoBMP 944.82
// /prototipo/temperatureBMP 27
// /prototipo/umidadeSolo 1024


var mqttClient  = mqtt.connect("mqtt://localhost",{
	clientId: 'prototipo', 
	protocolId: 'MQIsdp', 
	protocolVersion: 3, 
	connectTimeout:1000, 
	debug:true
});

mqttClient.on('connect', function () {
    mqttClient.subscribe("/prototipo/temperaturaDHT");
    mqttClient.subscribe("/prototipo/umidadeDHT");
    mqttClient.subscribe("/prototipo/pressaoBMP");
    mqttClient.subscribe("/prototipo/temperatureBMP");
    mqttClient.subscribe("/prototipo/umidadeSolo");
});

mqttClient.on('message', function (topic, message) {
    // message is Buffer
    if(topic == "/prototipo/temperaturaDHT"){
        addTemperaturaDHT(message);
    }else if(topic	== "/prototipo/umidadeDHT"){
        addUmidadeDHT(message);
    }else if(topic	== "/prototipo/pressaoBMP"){
        addPressaoBMP(message);
    }
    else if(topic	== "/prototipo/temperatureBMP"){
        addTemperaturaBMP(message);
    }
    else if(topic	== "/prototipo/umidadeSolo"){
        addUmidadeSolo(message);
    }
});

mqttClient.on('error', function(){
    console.log("ERROR")
    mqttClient.end()
});

function addTemperaturaDHT(message){
    temperaturaDHT.create({value: message.toString()}, function(err, add){
    		if(err){
    			console.log("Error to add data to DB!");
    		}else{
    			console.log("Temp DHT add: " + message.toString());
    		}
    	});
}

function addUmidadeDHT(message){
    umidadeDHT.create({value: message.toString()}, function(err, add){
    		if(err){
    			console.log("Error to add data to DB!");
    		}else{
    			console.log("Umidade DHT add: " + message.toString());
    		}
    	});
}

function addPressaoBMP(message){
    pressaoBMP.create({value: message.toString()}, function(err, add){
    		if(err){
    			console.log("Error to add data to DB!");
    		}else{
    			console.log("Pressao BMP180 add: " + message.toString());
    		}
    	});
}

function addTemperaturaBMP(message){
    temperaturaBMP.create({value: message.toString()}, function(err, add){
    		if(err){
    			console.log("Error to add data to DB!");
    		}else{
    			console.log("Temp BMP180 add: " + message.toString());
    		}
    	});
}

function addUmidadeSolo(message){
    umidadeSolo.create({value: message.toString()}, function(err, add){
    		if(err){
    			console.log("Error to add data to DB!");
    		}else{
    			console.log("Umidade Solo add: " + message.toString());
    		}
    	});
}