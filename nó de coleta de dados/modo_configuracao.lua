print("*** Modo de configuracao inciado ****")

wifi.setmode(wifi.SOFTAP)
wifi.ap.config({ssid="AgroTech"})
wifi.ap.setip({ip="192.168.0.1",netmask="255.255.255.0",gateway="192.168.0.1"})

print("*** Iniciando o servidor Web ***")
servidor = net.createServer(net.TCP)

servidor:listen(80,function(conn)
	conn:on("receive", function(client,request)
		print("*** User request! ****")

		--Procurando por GET
		get = string.find(request,"GET")

		if get ~= nil then
		    print("*** Enviando form ao usuario ***")
            
            pagina = "HTTP/1.1 200 OK\r\n"
            pagina = pagina .. "Content-Type: text/html\r\n\r\n<!DOCTYPE HTML>\r\n"
			
			pagina = pagina .. '<html>'
			pagina = pagina .. '<head>'
			pagina = pagina .. '<meta charset="utf-8">'
			pagina = pagina .. '<title>Bem-Vindo | AgroTech</title>'
			pagina = pagina .. '<style media="screen">'
			pagina = pagina .. '</style>'
			pagina = pagina .. '</head>'
			pagina = pagina .. '<body>'
			pagina = pagina .. '<div>'
			pagina = pagina .. '<h2>Bem-vindo | Página de Configuração do protótipo</h2>'
			pagina = pagina .. '<p>Insira os seguintes dados para configurar o módulo</p>'
			pagina = pagina .. '<form method="POST" action="http://192.168.0.1/">'
			pagina = pagina .. '<table>'
			pagina = pagina .. '<tr>'
			pagina = pagina .. '<td><b>Nome da rede</b></td>'
			pagina = pagina .. '<td><input type="text" name="SSID"></td>'
			pagina = pagina .. '</tr>'
			pagina = pagina .. '<tr>'
			pagina = pagina .. '<td><b>Senha</b></td>'
			pagina = pagina .. '<td><input type="password" name="password"></td> '
			pagina = pagina .. '</tr>'
			pagina = pagina .. '<tr>'
			pagina = pagina .. '<td><b>Servidor</b></td>'
			pagina = pagina .. '<td><input type="text" name="servidor"></td> '
			pagina = pagina .. '</tr>'
			pagina = pagina .. '<tr>'
			pagina = pagina .. '<td><b>Porta</b></td>'
			pagina = pagina .. '<td><input type="text" name="porta"></td> '
			pagina = pagina .. '</tr>'
			pagina = pagina .. '<tr>'
			pagina = pagina .. '<td><b>Intervalo(segundos)</b></td>'
			pagina = pagina .. '<td><input type="text" name="intervalo"></td> '
			pagina = pagina .. '</tr>'
			pagina = pagina .. '</table>'
			pagina = pagina .. '<br>'
			pagina = pagina .. '<input type="submit" name="" value="Salvar!">'
			pagina = pagina .. '</form>'
			pagina = pagina .. '</div>'
			pagina = pagina .. '</body>'
			pagina = pagina .. '</html>'

            client:send(pagina, function(enviado)
                print("*** Form enviado com sucesso ***")
                conn:close()
                collectgarbage()
            end)

		elseif string.find(request,"POST") ~= nil then
            print("*** Recebendo dados do usuario ***")
            print(request)

            n = string.find(request, "SSID") --vejo onde tem SSID no request e busco a partir dai

            dados = {}
			file.open("configuracao.lua", "w")

			for k, v in string.gmatch(string.sub(request, n).."&", "(%w+)=([^&]+)&") do
			    dados[k] = v
			    print('Dados(' .. k .. "): " .. v)
			end

			file.write('SSID="'.. dados.SSID ..'"\n')
			file.write('password="'.. dados.password ..'"\n')
			file.write('servidor="'.. dados.servidor ..'"\n') 
			file.write('porta='.. dados.porta .. "\n") 
			file.write('intervalo='.. dados.intervalo  .. "\n")

			client:send("<html><center><h2>Dados salvos :)</h2></center></html>", function(enviado)
			    conn:close()    
			    file.close()
				node.compile("configuracao.lua")
				file.remove("configuracao.lua")
				node.restart() 
			end)

			
            
        end
	end)
end)
