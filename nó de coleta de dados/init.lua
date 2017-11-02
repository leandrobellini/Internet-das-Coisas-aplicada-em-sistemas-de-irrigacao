--Iniciando o script e conectando no Wifi
print("*** Iniciando o script init.lua ***")
LED_PIN = 2 --GPIO4  Led de status do prototipo (Mostra se a conexao foi feita... dados enviados...) 
interruptPin = 6 --GPIO 12
gpio.mode(LED_PIN, gpio.OUTPUT)
gpio.write(LED_PIN, gpio.HIGH) --Led apagado
gpio.mode(interruptPin,  gpio.INT)  --interrupcao pra reset das configuracoes

function interrupt(level, stamp)-- callback function while interrupt
    gpio.trig(interruptPin)             -- disable interrupt for that pin
    print('***** Interrupt on pin:', interruptPin)--print interrupt pin no.
    file.remove('configuracao.lc')    --remove arquivo de configuracao... reset no chip q irah entrar em modo de configuracao
    node.restart()
    --gpio.trig(interruptPin,"up", interrupt)--re-enable interrupt on pin while exit
end

gpio.trig(interruptPin,"down", interrupt)-- set interrupt type up i.e. rising edge

if pcall(function ()
    print("***  Abrindo arquivo de configuracao! *** ")
    dofile("configuracao.lc")
   end) 
then
      wifi.setmode(wifi.STATION)
      print("***  Conectando na rede! *** ")
      wifi.sta.config(SSID,password)
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
               blink() --Indica que estah conectado piscando o LED

               print("*** Conectado! IP:  "..wifi.sta.getip())
               print("*** Vamos rodar o MQTT ***")

               --Executando o mqtt para envio de dados
               dofile("mqtt.lua")
            end
         end)
else
   print("Entrando no modo de configuracao")
   dofile("modo_configuracao.lua")
end

function blink()
   -- Para mostrar se as coisas estao OK
   US_TO_MS = 1000
   
   for i=1,2,1 
   do 
      gpio.write(LED_PIN, gpio.LOW)
      tmr.delay(500 * US_TO_MS)
      gpio.write(LED_PIN, gpio.HIGH)
      tmr.delay(500 * US_TO_MS)   
   end
end

