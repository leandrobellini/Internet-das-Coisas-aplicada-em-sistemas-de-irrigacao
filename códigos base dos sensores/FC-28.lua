-- 409-1024 and turns it into 100-0%.
sum  = 0
for i=1,1000,1 
do 
   sum = sum + adc.read(0)
   tmr.delay(10)
end

print(sum/1000)
