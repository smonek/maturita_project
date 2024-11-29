MATURITNÍ PROJEKT IT4

ROBOTIKA
Robot bude zaměřen na rozpoznání barev pomocí kamery. Cílem projektu je aby robot byl schopný rozpoznat více barev jejich pozici a rozměry a případně různé čárové kódy.
Kamera bude od firmy Pixy a verze kamery je Pixy1.
Kamera je schopná rozpoznat až sedm barev. Také je schopná rozpoznat jednoduché čárové kódy, velikost objektu.

![image](https://github.com/user-attachments/assets/d4877efa-77d0-44a7-ac8a-69d06fae34d1)

Budu používat **Arduino Integrated Development Environment** a uploadovat budu na arduino nano v4.

![image](https://github.com/user-attachments/assets/66edcb89-0c16-42e4-a337-dd630b5e97c9)

Kameru s arduinem jsem propojil pomocí kabelu mg connfly.

![image](https://github.com/user-attachments/assets/2166f69e-408c-4976-8c6b-d90e816519b2)

Konkurenční projekty a zdroje: 
https://github.com/ev3dev/ev3dev.github.io/blob/master/docs/tutorials/using-pixy-camera.md
https://github.com/ilyas9461/Pixy2-ball-sensing
složka pěti projektů: https://github.com/topics/pixycam?l=c%2B%2B
tutoriál: https://github.com/KWSmit/Pixy_ev3dev

POSTUP: 
1. Zjistím si a seženu si všechny potřebné části projektu (kamera pixy, arduino, baterii, kable) na Slezské univerzitě, kde bych měl mít přístup ke všemu.
2. Promluvím s docentem jestli si mohu vzít kameru domů a zeptám se ho na to co je vše potřeba na její zapnutí.
3. Doma nejdříve rozchodím pouze kameru aby byla schopná rozpoznat barvy a snadné čárové kódy.
4. Dále budu hledat další funkce kamery a udělám jich co nejvíce.

Už se mi podařilo zprovoznit kameru a nahrávat do ní kód skrze arduino nano. Abych to ale dokázal tak jsem si musel udělat uplně nový operační systém ve virtual boxu a já se rozhodl pro windows 10, protože to v mém windows 11 nefungovalo kvůli zastaralým ovladačům.
V arduino ide mi momentálně v serial monitoru vypisuje, že kamera detekovala objekt, jeho velikost a pozici.
