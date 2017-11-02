bmp085.init(3, 4)

local p = bmp085.pressure()
print(string.format("Pressure: %s mbar", p / 100))

local t = bmp085.temperature()
print(string.format("Temperature: %s degrees C", t / 10))
