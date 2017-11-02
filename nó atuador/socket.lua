--Cria o cliente
print("*** Iniciando o app socket do ESP8266 ***")

local ws = websocket.createClient()
ws:config({headers={['User-Agent']='NodeMCU'}})

ws:on("connection", function(ws)
  print('got ws connection')
  ws:send('Oi servidor!')
end)
ws:on("receive", function(_, msg, opcode)
    tempo = tonumber(msg)
    if tempo == nil then
        print("Problemas ao receber o tempo de irrigacao")
    else
        print("Irrigacao Iniciada: " .. tempo .. " Segundos")
        gpio.write(LED_PIN, gpio.HIGH)
        if not tmr.create():alarm(tempo * 1000, tmr.ALARM_SINGLE, function()
          gpio.write(LED_PIN, gpio.LOW)
          print("Irrigacao completa")
          ws:send('Irrigacao Completada com Sucesso!')
        end)
        then
          print("Erro ao criar o alarme")
          node.restart()
        end
    end
end)

ws:on("close", function(_, status)
  print('connection closed', status)
  ws = nil -- required to lua gc the websocket client
  node.restart()
end)

ws:connect('ws://www.leandrobellini.com.br:3000/')
