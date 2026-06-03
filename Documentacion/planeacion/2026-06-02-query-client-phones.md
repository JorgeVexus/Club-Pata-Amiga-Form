# Planificación: Consulta de Teléfonos de Clientes en Supabase

Este documento detalla el plan para verificar en la base de datos de Supabase cuáles de los clientes proporcionados tienen un número de teléfono registrado.

## Propuesta de Solución

Crearemos un script temporal en Node.js que realice las siguientes acciones:
1. Leer las variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` desde el archivo `.env.local`.
2. Inicializar el cliente administrativo de Supabase (`@supabase/supabase-js`).
3. Definir la lista de los 83 correos electrónicos proporcionados.
4. Consultar la tabla `users` buscando los registros que coincidan con estos correos.
5. Formatear y mostrar la lista completa indicando:
   - Correo electrónico.
   - Si existe en la base de datos de Supabase.
   - Teléfono registrado (si lo tiene).
6. Exportar los resultados en formato Markdown (tabla) y texto plano.

## Lista de Correos a Verificar

Se verificarán los siguientes 83 correos:
1. aba_habib@hotmail.com
2. afuentesm88@gmail.com
3. aguilarmedelbelen@gmail.com
4. ale_2-@hotmail.com
5. alelpsz1994@gmail.com
6. anettepul.24@gmail.com
7. angiegp15@yahoo.com.mx
8. ariasantillan12@gmail.com
9. cano02hdz@gmail.com
10. cashchaparro@gmail.com
11. celestenevero6@gmail.com
12. cesiahzurinidiazchavez@gmail.com
13. cristian_eg97@hotmail.com
14. cristycamcas@gmail.com
15. crlacorona@gmail.com
16. darien126@hotmail.com
17. ddonajigc@gmail.com
18. delgadillozu@icloud.com
19. dnnrdgz.vet@gmail.com
20. e.amancio@gmail.com
21. elenadomin@gmail.com
22. gabo.rivero1401@gmail.com
23. gaby6952@hotmail.com
24. gabyfrancori@icloud.com
25. hahc22@hotmail.com
26. harutmi@hotmail.com
27. hola@email.com
28. holligato04@gmail.com
29. isaid_@msn.com
30. jenymafi@gmail.com
31. jesssotom@gmail.com
32. juanfcorojas1iv12@gmail.com
33. jzamudio676@gmail.com
34. kar.glez21@outlook.com
35. kathiapacheco1988@gmail.com
36. katyso2014@gmail.com
37. lahinojosac@gmail.com
38. lekume@hotmail.com
39. leohdezadan@gmail.com
40. ligiapaso09@gmail.com
41. lily1923@live.com.mx
42. lizgil7@yahoo.com
43. losan.pau@gmail.com
44. luisosmany.mtz@gmail.com
45. magokosa@gmail.com
46. marcela.quinterob@gmail.com
47. marciachuilrdz@gmail.com
48. marco.olivaresr@outlook.com
49. marcogutierrez130697@gmail.com
50. marelo2021@gmail.com
51. may.matty.150316@gmail.com
52. mayahuellmq@gmail.com
53. mc_publicidad@yahoo.com.mx
54. mezaheidi37@gmail.com
55. minjas2183@gmail.com
56. mnsanchez@kio.tech
57. molinamatusmich@gmail.com
58. moncarrion@icloud.com
59. mqmaga@gmail.com
60. munahanono@hotmail.com
61. pattysglml@gmail.com
62. paula_xareni@hotmail.com
63. pedroalbertopuentes@gmail.com
64. platasosaxochilt10@gmail.com
65. rgacesar.reyes@gmail.com
66. rneguerrero@yahoo.com
67. rodmondra@gmx.com
68. rodrigo_2390@hotmail.com
69. rodrigo_2399@hotmail.com
70. rosylopz068@gmail.com
71. sflot10@live.com.mx
72. tenygs@hotmail.com
73. valery92salguero@gmail.com
74. vanessamurrieta09@gmail.com
75. vanpioso@gmail.com
76. vemaetommy@hotmail.com
77. virisofi95@gmail.com
78. vivi.santiago13@hotmail.com
79. vozdem18@gmail.com
80. xarefotografia@gmail.com
81. yair.cedil@gmail.com
82. ysramirezb@outlook.com
83. zai.zinq@gmail.com

## Pasos de Ejecución

### Paso 1: Crear Script de Consulta
Crearemos el script `C:\Users\Jorge Cerna\.gemini\antigravity-ide\brain\6e4dd9ca-4ae4-472b-910b-73ce6355ec08/scratch/query-phones.js` que se encargará de realizar la consulta en Supabase.

### Paso 2: Ejecutar el Script
Ejecutaremos el script desde la terminal y capturaremos su salida.

### Paso 3: Generar Reporte de Resultados
Presentaremos los resultados al usuario.
