--Cria o cliente
print("*** Iniciando o MQTT do ESP8266 ***")

m = mqtt.Client("clientePrototipo", 120)

--Envia dados para nuvem a cada x segundos definido em configuracoes
if not tmr.create():alarm(intervalo * 1000, tmr.ALARM_AUTO, function()
    print("**** Status: ".. wifi.sta.status())
    m:close()
    -------- Temperatura e Umidade do Ar DHT 22 ----------
    pin = 1 --GPIO 5
    status, temp, humi, temp_dec, humi_dec = dht.read(pin)
    if status == dht.OK then
        -- Enviar dados do DHT
        m:connect(servidor, porta, 0, 
          function(client)
            print("*** Conectado ao Broker***")

            client:publish("/prototipo/temperaturaDHT", temp, 0, 0, 
            function(client) 

                print("*** Temperatura DHT enviada ao broker!") 

                client:publish("/prototipo/umidadeDHT", humi, 0, 0, 
                  function(client) 

                      print("*** Umidade DHT enviada ao broker!") 

                      -- Enviar dados do BMP180
                      bmp085.init(3, 4)
                      local pBMP = bmp085.pressure()
                      local tBMP = bmp085.temperature()
                      
                      client:publish("/prototipo/pressaoBMP", pBMP/100, 0, 0, 
                        function(client) 

                            print("*** Pressao BMP enviada ao broker!") 

                            client:publish("/prototipo/temperatureBMP", tBMP/10, 0, 0, 
                              function(client) 

	                                print("*** Temperatura BMP enviada ao broker!") 

	                                  -- Enviar dados do sensor de umidade do Solo
	                                  -- Tiro a média dos dados coletados
	                                sum  = 0
									for i=1,1000,1 
									do 
									   sum = sum + adc.read(0)
									   tmr.delay(10)
									end

									client:publish("/prototipo/umidadeSolo", sum/1000, 0, 0, 
			                        function(client) 

			                            print("*** Umidade do Solo enviada ao broker!") 

	                                  -- Encerra envio de dados
	                                  m:close()
                                      blink() --Indica via led q dados foram enviados
                                        
			                        end)
                              end) 
                        end) 
                  end)  
            end)
          end,
          function(client, reason)
            print("*** Falha ao conectar no Broker: " .. reason)
            node.restart()
          end
        )
    
    elseif status == dht.ERROR_CHECKSUM then
        print( "DHT Checksum error." )
    elseif status == dht.ERROR_TIMEOUT then
        print( "DHT timed out." )
    end

    --- Outros sensores ----
    
end)
then
print("*** Erro ao criar o alarm ****")
end
