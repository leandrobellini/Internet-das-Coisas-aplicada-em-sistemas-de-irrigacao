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
mongoose.connect("mongodb://localhost/auth_demo_app");

//APP config
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

//verifica se foi solicitado HTTPS... se nao foi, joga pra HTTPS
function requireHTTPS(req, res, next) {
    if (!req.secure) {
        return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
}

//HTTPS
app.use(requireHTTPS); //força uso do HTTPS


// **** Métodos de autenticaçao ****
app.use(require("express-session")({
    secret: "Trabalho de TCC - Leandro Bellini @ 2017 #USP #ICMC",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());   //metodos do UserSchema.plugin(passportLocalMongoose) no modelo User 
passport.deserializeUser(User.deserializeUser());


function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }

    res.redirect("/login");
}



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

//Previsao do Tempo
var darkSkyURL = 'https://api.darksky.net/forecast/3608a4312b8ba8775e52af89695f09f9/-22.8238458,-47.0796923?lang=pt&units=si';

//vetor de controle dos horarios de irrigaçao
var horariosDeIrrigacao = {};
var sistemaTravado = 0;
var noConectado = 0;

//RESTful routes
app.get("/",function(req, res){
	res.redirect("https://www.linkedin.com/in/leandrobellini/");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.post("/login", passport.authenticate("local", { //middleware
        sucessRedirect: "/agro",
        failureRedirect: "/login"
    }), function(req, res){
        res.redirect("/agro");
});

app.get("/register", isLoggedIn, function(req, res){    //form de registro
    res.render("register");
});

app.post("/register", isLoggedIn, function(req, res){
    //adicionando o novo usuário e autenticando o mesmo...
    User.register(new User({username: req.body.username}), req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function(){
            res.redirect("/agro");
        });
    });
});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

app.get("/agro", isLoggedIn, function(req, res){
    //pegando últimos dados do Banco para exibir na Home

    async.series([
            //Temperatura do ambiente via DHT
        function(callback) {
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
                        callback(null, data);
                    }
                }
            });
        },
            //Umidade do ar via DHT
        function(callback) {
            umidadeDHT.find({
                created: {
                    //Busco dados da última hora
                    $gte: moment().subtract(1, "hours"),
                    $lt: moment()
                }
                },function(err, dados){
                if(err){
                    res.send("Erro ao buscar última umidade DHT!!");
                }else{
                    if(dados.length == 0){
                        //banco está vazio
                        callback(null, undefined);
                    }else{
                        var umidadeDHTAtual = dados[dados.length -1]; //ultima umidade registrada
                        var umidadeDHTUltimaHora = dados[0]; //vetor de dados vai da ultima data até a primeira
                        var data = {
                            umidadeDHTAtual: umidadeDHTAtual,
                            umidadeDHTUltimaHora: umidadeDHTUltimaHora
                        }
                        callback(null, data);
                    }
                }
            });
        },
            //Pressao Atmosférica
        function(callback) {
            pressaoBMP.find({
                created: {
                    //Busco dados da última hora
                    $gte: moment().subtract(1, "hours"),
                    $lt: moment()
                }
                },function(err, dados){
                if(err){
                    res.send("Erro ao buscar última pressao BMP180!!");
                }else{
                    if(dados.length == 0){
                        //banco está vazio
                        callback(null, undefined);
                    }else{
                        var pressaoAtual = dados[dados.length -1]; //ultima umidade registrada
                        var pressaoUltimaHora = dados[0]; //vetor de dados vai da ultima data até a primeira
                        var data = {
                            pressaoAtual: pressaoAtual,
                            pressaoUltimaHora: pressaoUltimaHora
                        }
                        callback(null, data);
                    }
                }
            });
        },
            //Temperatura Ambiente BMP180
        function(callback) {
            temperaturaBMP.find({
                created: {
                    //Busco dados da última hora
                    $gte: moment().subtract(1, "hours"),
                    $lt: moment()
                }
                },function(err, dados){
                if(err){
                    res.send("Erro ao buscar última temperatura BMP!!");
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
                        callback(null, data);
                    }
                }
            });
        },
            //Umidade do Solo
        function(callback) {
            umidadeSolo.find({
                created: {
                    //Busco dados da última hora
                    $gte: moment().subtract(1, "hours"),
                    $lt: moment()
                }
                },function(err, dados){
                if(err){
                    res.send("Erro ao buscar última Umidade do Solo!!");
                }else{
                    if(dados.length == 0){
                        //banco está vazio
                        callback(null, undefined);
                    }else{
                        var umidadeSoloAtual = dados[dados.length -1]; //ultima temperatura registrada
                        var umidadeSoloUltimaHora = dados[0]; //vetor de dados vai da ultima data até a primeira
                        var data = {
                            umidadeSoloAtual: umidadeSoloAtual,
                            umidadeSoloUltimaHora: umidadeSoloUltimaHora
                        }
                        callback(null, data);
                    }
                }
            });
        },
        function(callback){
            //previsao do tempo
            request(darkSkyURL, function (err, response, body) {
              if(err){
                console.log('error:', error);
              } else {
                callback(null, JSON.parse(body));
              }
            });
        },
        function(callback){
            //temperaturas para criar chart na home
            temperaturaDHT.find({
            created: {
                //Busco dados das últimas 24 horas
                $gte: moment().subtract(24, "hours"),
                $lt: moment()
            }
            }, function(err, dados){
            if(err){
                console.log(err);
            }else{
                datas = [];
                temperaturas = [];

                dados.forEach(function(dado){
                    datas.push(moment(dado.created).format('MM/DD/YYYY HH:m'));
                    temperaturas.push(dado.value);
                });
                callback(null, {datas: datas, temperaturas: temperaturas});
            }
        });
        }
        
    ],
    // optional callback
    function(err, results) {
        var ultimaTemperatura,
            temperaturaUltimaHora,
            ultimaUmidadeDHT,
            umidadeDHTUltimaHora,
            ultimaPressao,
            pressaoUltimaHora,
            umidadeSoloAtual,
            umidadeSoloUltimaHora;

            if(results[0] === undefined){   //Nao há dados no banco sobre temperatura
                ultimaTemperatura = 0;
                temperaturaUltimaHora = 0;
            }else{
                ultimaTemperatura =  ((parseFloat(results[0].temperaturaAtual.value)+parseFloat(results[3].temperaturaAtual.value))/2).toFixed(1);
                temperaturaUltimaHora = ((parseFloat(results[0].temperaturaUltimaHora.value)+parseFloat(results[3].temperaturaUltimaHora.value))/2).toFixed(1);
            }

            if(results[1] === undefined){   //Nao há dados no banco sobre umidade do ar
                ultimaUmidadeDHT = 0;
                umidadeDHTUltimaHora = 0;
            }else{
                ultimaUmidadeDHT = parseFloat(results[1].umidadeDHTAtual.value).toFixed(1);
                umidadeDHTUltimaHora = parseFloat(results[1].umidadeDHTUltimaHora.value).toFixed(1);
            }

            if(results[2] === undefined){   //Nao há dados no banco sobre pressao atmosferica
                ultimaPressao = 0;
                pressaoUltimaHora = 0;
            }else{
                ultimaPressao = parseInt(results[2].pressaoAtual.value);
                pressaoUltimaHora = parseInt(results[2].pressaoUltimaHora.value);
            }

            if(results[4] === undefined){   //Nao há dados no banco sobre umidade do solo
                umidadeSoloAtual = 0;
                umidadeSoloUltimaHora = 0;
            }else{
                    /*
                    O sensor de umidade do solo me dá valores analogicos de 0 a 1024,
                    entao irei converter esses valores para % seguindo a equaçao da reta -> y = (-100/1024)*x +100
                        0 corresponde a umidade total
                        1024 totalmente seco
                */
                umidadeSoloAtual = parseInt((-100/1024)*results[4].umidadeSoloAtual.value +100);
                umidadeSoloUltimaHora = parseInt((-100/1024)*results[4].umidadeSoloUltimaHora.value +100);
            }


        var ultimosDados = {
            //ultima temperatura: média dos dois sensores (DHT + BMP)
            ultimaTemperatura: ultimaTemperatura,
            temperaturaUltimaHora: temperaturaUltimaHora,
            
            //Ultima umidade do ar e da ultima hora
            ultimaUmidadeDHT:  ultimaUmidadeDHT,
            umidadeDHTUltimaHora: umidadeDHTUltimaHora,            

            //Ultima pressao
            ultimaPressao: ultimaPressao,
            pressaoUltimaHora: pressaoUltimaHora,

            //Ultima Umidade Solo
            umidadeSoloAtual: umidadeSoloAtual,
            umidadeSoloUltimaHora: umidadeSoloUltimaHora, 

            //Dados sobre previsao do tempo
            previsaoTempoAgora: results[5].currently, //dados de previsao atuais
            previsaoSemana: [
                {
                    diaSemana: moment.unix(results[5].daily.data[0].time).format("ddd"),
                    tempMax: results[5].daily.data[0].temperatureMax,
                    tempMin: results[5].daily.data[0].temperatureMin,
                    icon: results[5].daily.data[0].icon
                },
                {
                    diaSemana: moment.unix(results[5].daily.data[1].time).format("ddd"),
                    tempMax: results[5].daily.data[1].temperatureMax,
                    tempMin: results[5].daily.data[1].temperatureMin,
                    icon: results[5].daily.data[1].icon
                },
                {
                    diaSemana: moment.unix(results[5].daily.data[2].time).format("ddd"),
                    tempMax: results[5].daily.data[2].temperatureMax,
                    tempMin: results[5].daily.data[2].temperatureMin,
                    icon: results[5].daily.data[2].icon
                },
                {
                    diaSemana: moment.unix(results[5].daily.data[3].time).format("ddd"),
                    tempMax: results[5].daily.data[3].temperatureMax,
                    tempMin: results[5].daily.data[3].temperatureMin,
                    icon: results[5].daily.data[3].icon
                },
                {
                    diaSemana: moment.unix(results[5].daily.data[4].time).format("ddd"),
                    tempMax: results[5].daily.data[4].temperatureMax,
                    tempMin: results[5].daily.data[4].temperatureMin,
                    icon: results[5].daily.data[4].icon
                },
                {
                    diaSemana: moment.unix(results[5].daily.data[5].time).format("ddd"),
                    tempMax: results[5].daily.data[5].temperatureMax,
                    tempMin: results[5].daily.data[5].temperatureMin,
                    icon: results[5].daily.data[5].icon
                }
            ],
            dadosChartTemperatura: results[6]
        };
        res.render("index", {ultimosDados: ultimosDados});
        //res.send(ultimosDados);
    });
});

app.get("/schedule", isLoggedIn, function(req, res) {
    scheduleIrrigacao.find({},{}, { sort: { 'horario' : 1 } } ,function(err, dados){
        if(err){
            res.send("Erro no banco");
        }else{
            res.render("schedule", {horariosDeIrrigacao: dados, sistemaTravado: sistemaTravado, noConectado: noConectado});
        }
    });
    
});

app.get("/schedule/adicionar/:horario", isLoggedIn, function(req, res) {
    var novoHorario = req.params.horario.split(":");
    var hora = novoHorario[0];
    var minuto = novoHorario[1];

    var key = hora + minuto;
 
    if(horariosDeIrrigacao[key] === undefined){

            //schedule Job
        var rule = new schedule.RecurrenceRule();
        rule.hour = parseInt(hora);
        rule.minute = parseInt(minuto);

        //uso esse vetor para controlar os jobs, caso o cliente add/remova um horário
        horariosDeIrrigacao[key] = schedule.scheduleJob(rule, irrigar);

        scheduleIrrigacao.create({
            horario: req.params.horario
        });

        res.send("Ok");
    }else{
        res.send("Erro");
    }
});

app.get("/schedule/remover/:horario", isLoggedIn, function(req, res) {
    var novoHorario = req.params.horario.split(":");
    var hora = novoHorario[0];
    var minuto = novoHorario[1];

    var key = hora + minuto;
 
    if(horariosDeIrrigacao[key] === undefined){
        res.send("erro");
    }else{
        horariosDeIrrigacao[key].cancel();
        horariosDeIrrigacao[key] = undefined;
        scheduleIrrigacao.remove({ horario: req.params.horario }, function (err) {
          if (err){
            res.send("erroBD");
          }else{
            res.send("Ok");
          }
        });

    }
});

app.get("/schedule/mudarEstadoSistema", isLoggedIn, function(req, res){
    if(sistemaTravado == 0){
        sistemaTravado = 1;
        res.send("O sistema foi travado, pausando qualquer Irrigaçao Automática!");
    }else{
        sistemaTravado = 0;
        res.send("Irrigaçao Automática operando novamente!");
    }
    
});

app.get("/schedule/irrigarAgora", isLoggedIn, function(req, res){
    if(irrigar(60)){
        res.send("Ok");
    }else{
        res.send("Error");
    }
        
});

app.get("/previsao", isLoggedIn, function(req, res) {
    request(darkSkyURL, function (err, response, body) {
      if(err){
        console.log('error:', error);
      } else {
        res.send(body);
      }
    });
});

app.get("/sobre", isLoggedIn, function(req, res) {
    res.render("sobre");
    
});


app.get("/temperaturaDHT/chart", isLoggedIn, function(req, res) {
    temperaturaDHT.find({
        created: {
            //Busco dados das últimas 24 horas
            $gte: moment().subtract(24, "hours"),
            $lt: moment()
        }
        }, function(err, dados){
        if(err){
            console.log(err);
        }else{
            datas = [];
            temperaturas = [];

            dados.forEach(function(dado){
                datas.push(moment(dado.created).format('MM/DD/YYYY HH:m'));
                temperaturas.push(dado.value);
            });
            res.render("temperaturaDHTChart", {datas: datas, temperaturas: temperaturas});
        }
    });
});

app.get("/umidadeDHT/chart", isLoggedIn, function(req, res) {
    umidadeDHT.find({
        created: {
            //Busco dados das últimas 24 horas
            $gte: moment().subtract(24, "hours"),
            $lt: moment()
        }
        }, function(err, dados){
        if(err){
            console.log(err);
        }else{
            datas = [];
            umidades = [];

            dados.forEach(function(dado){
                datas.push(moment(dado.created).format('MM/DD/YYYY HH:m'));
                umidades.push(dado.value);
            });
            res.render("umidadeDHTChart", {datas: datas, umidades: umidades});
        }
    });
});

app.get("/temperaturaBMP/chart", isLoggedIn, function(req, res) {
    temperaturaBMP.find({
        created: {
            //Busco dados das últimas 24 horas
            $gte: moment().subtract(24, "hours"),
            $lt: moment()
        }
        }, function(err, dados){
        if(err){
            console.log(err);
        }else{
            datas = [];
            temperaturas = [];

            dados.forEach(function(dado){
                datas.push(moment(dado.created).format('MM/DD/YYYY HH:m'));
                temperaturas.push(dado.value);
            });
            res.render("temperaturaBMPChart", {datas: datas, temperaturas: temperaturas});
        }
    });
});

app.get("/pressaoBMP/chart", isLoggedIn, function(req, res) {
    pressaoBMP.find({
        created: {
            $gte: moment().subtract(24, "hours"),
            $lt: moment()
        }
        }, function(err, dados){
        if(err){
            console.log(err);
        }else{
            datas = [];
            pressao = [];

            dados.forEach(function(dado){
                datas.push(moment(dado.created).format('MM/DD/YYYY HH:m'));
                pressao.push(dado.value);
            });
            res.render("pressaoBMPChart", {datas: datas, pressao: pressao});
        }
    });
});

app.get("/umidadeSolo/chart", isLoggedIn, function(req, res) {
    umidadeSolo.find({
        created: {
            $gte: moment().subtract(24, "hours"),
            $lt: moment()
        }
        }, function(err, dados){
        if(err){
            console.log(err);
        }else{
            datas = [];
            umidades = [];

            dados.forEach(function(dado){
                datas.push(moment(dado.created).format('MM/DD/YYYY HH:m'));
                umidades.push(dado.value);
            });
            res.render("umidadeSoloChart", {datas: datas, umidades: umidades});
        }
    });
});

app.get("/temperaturaDHT/tabela", isLoggedIn, function(req, res) {
    temperaturaDHT.find({}, function(err, dados){
        if(err){
            console.log(err);
        }else{
            var novo = [];
            dados.forEach(function(dado){
                novo.push({created: moment(dado.created).format("DD/MM/YYYY HH:mm"), value: dado.value, _id: dado._id});
            });
            res.render("temperaturaDHTTable", {dados: novo});
        }
    });
});

app.get("/umidadeDHT/tabela", isLoggedIn, function(req, res) {
    umidadeDHT.find({}, function(err, dados){
        if(err){
            console.log(err);
        }else{
            var novo = [];
            dados.forEach(function(dado){
                novo.push({created: moment(dado.created).format("DD/MM/YYYY HH:mm"), value: dado.value, _id: dado._id});
            });
            res.render("umidadeDHTTable", {dados: novo});
        }
    });
});

app.get("/pressaoBMP/tabela", isLoggedIn, function(req, res) {
    pressaoBMP.find({}, function(err, dados){
        if(err){
            console.log(err);
        }else{
            var novo = [];
            dados.forEach(function(dado){
                novo.push({created: moment(dado.created).format("DD/MM/YYYY HH:mm"), value: dado.value, _id: dado._id});
            });
            res.render("pressaoBMPTable", {dados: novo});
        }
    });
});

app.get("/temperaturaBMP/tabela", isLoggedIn, function(req, res) {
    temperaturaBMP.find({}, function(err, dados){
        if(err){
            console.log(err);
        }else{
            var novo = [];
            dados.forEach(function(dado){
                novo.push({created: moment(dado.created).format("DD/MM/YYYY HH:mm"), value: dado.value, _id: dado._id});
            });
            res.render("temperaturaBMPTable", {dados: novo});
        }
    });
});

app.get("/umidadeSolo/tabela", isLoggedIn, function(req, res) {
    umidadeSolo.find({}, function(err, dados){
        if(err){
            console.log(err);
        }else{
            var novo = [];
            dados.forEach(function(dado){
                novo.push({created: moment(dado.created).format("DD/MM/YYYY HH:mm"), value: dado.value, _id: dado._id});
            });
            res.render("umidadeSoloTable", {dados: novo});
        }
    });
});

//Page Not Found - 404
app.get("*", isLoggedIn, function(req, res) {
    res.render("page_404");
});


//Web Server Listen para o Dashboard HTTP
app.listen(80, function(){
    console.log("\n***********************************");
    console.log("Servidor rodando...");
}); 


//HTTPS
const options = {
  cert: fs.readFileSync('keys/chained.pem'),
  key: fs.readFileSync('keys/domain.key'),
};

https.createServer(options, app).listen(443);

//Web Socket para uso do nó de irrigacao (Atuador)
var server = http.createServer(function(request, response) {
    console.log('Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

server.listen(3000, function() {
    console.log('WebSocket is listening on port 3000');
});

wsServer = new webSocket({
    httpServer: server,
    autoAcceptConnections: false
});
 
//Connection com o nó
var connection;
 
// WebSocket server
wsServer.on('request', function(request) {
    connection = request.accept(null, request.origin);
    console.log("Conexao Efetuada pelo nó!");
    //connection.send("10");
    noConectado = 1;

  // This is the most important callback for us, we'll handle
  // all messages from users here.
  connection.on('message', function(message) {
    console.log(message.utf8Data);
  });

  connection.on('close', function(connection) {
    // close user connection
    noConectado = 0;
  });
});


//Funcao que de fato aciona as bombas para irrigacao
function irrigar(tempo){
    console.log("Irrigandoooooooooooooooooooooooooo");
    try{
        connection.send("60");
        return 1;
    }
    catch(err) {
        return 0;
    }
    
}

//Coloca no ar os Schedules
function configuraScheduleDeIrrigacoes(){
    scheduleIrrigacao.find({}, function(err, dados){
        if(err){
            console.log("Erro no banco ao buscar os horários de irrigaçao!");
        }else{
            console.log("Ativando horários de irrigaçao");
            //horariosDeSchedule
            if(dados.length == 0){
                console.log("Nenhum horário programado!");
            }else{
                console.log("Horários encontrados: " + dados.length);
                dados.forEach(function(dado){
                    console.log("\t" + dado.horario);

                        //pego hora e minutos -> 18:30 por ex
                    var meuHorario = dado.horario.split(":");
                    var hora = meuHorario[0];
                    var minuto = meuHorario[1];


                    var key = hora + minuto;

                        //schedule Job
                    var rule = new schedule.RecurrenceRule();
                    rule.hour = parseInt(hora);
                    rule.minute = parseInt(minuto);

                    //uso esse vetor para controlar os jobs, caso o cliente add/remova um horário
                    horariosDeIrrigacao[key] = schedule.scheduleJob(rule, irrigar);
                });
            }
        }
    });
}

configuraScheduleDeIrrigacoes();


