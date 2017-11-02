--Iniciando o script e conectando no Wifi
print("*** Iniciando o script init.lua ***")
LED_PIN = 2 --GPIO4 Relé conectado
gpio.mode(LED_PIN, gpio.OUTPUT)
gpio.write(LED_PIN, gpio.LOW) --Bomba apagada

wifi.setmode(wifi.STATION)
print("***  Conectando na rede! *** ")
wifi.sta.config("Dlink","Leandro2017")
wifi.sta.connect()

timeout = 0;
tmr.alarm(1, 1000, 1, function()
      if wifi.sta.getip() == nil then
         print("*** IP nao disponível, esperando... *** " .. timeout)
      timeout = timeout + 1
      if timeout == 60 then
       node.restart()
      end
      else
         tmr.stop(1)
         
         print("*** Conectado! IP:  "..wifi.sta.getip())
         print("*** Vamos rodar o Client App Socket ***")

         --Executando o mqtt para envio de dados
         dofile("socket.lua")
      end
   end)
