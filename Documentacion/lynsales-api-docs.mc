Lynsales - API de Contactos
Versión: 1.
Uso obligatorio: backend
Autenticación
Todas las solicitudes deben enviarse con los headers de autenticación proporcionados:
API_KEY = pit-af973e1a-30aa-4643-8146-325d875b1f3e
Authorization: Bearer API_KEY
Content-Type: application/json
⚠ Importante:
Las credenciales no deben exponerse en frontend. Todas las llamadas deben hacerse
desde el backend.
Headers parameters
Content-Type: application/json
Version: “2021-07-28”
Conceptos clave.
Nuestro sistema maneja creación y actualización de contactos mediante un endpoint
UPSERT.
El sistema:

Detecta duplicados
Actualiza si el contacto existe
Crea si no existe.
El identificador único del contacto es el “id”
Este “id” debe guardarse en su base de datos.
1. Upsert Contact
Crea o actualiza un contacto según los datos enviados.
Cuándo usarlo:
Formulario de registro donde agregan todos los datos.
Endpoint:
POST https://services.leadconnectorhq.com/contacts/upsert
Request Body
firstName string nullable
lastName string nullable
email string nullable
locationId string requerido. poner el siguiente valor: WSfoe3Cggh6XrHoGRMxG
gender string nullable example: male or female
phone string nullable
adress1 string nullable
city string nullable
state string nullable
postalCode string nullable
country string nullable example: US or MX
dateOfBirth object nullable
Formatos soportados para dateOfBirth: YYYY/MM/DD, MM/DD/YYYY, YYYY-MM-DD,
MM-DD-YYYY, YYYY.MM.DD, MM.DD.YYYY, YYYY_MM_DD, MM_DD_YYYY
Example request:
Node.js
AXIOS
const axios = require('axios');
let data = JSON.stringify({
"firstName": "angel",
"lastName": "Nova",
"name": "Angel Nova",
"email": "angel@lyndoors.com",
"locationId": "ve9EPM428h8vShlRW1KT",
"gender": "male",
"phone": "+1 888-888-8888",
"address1": "3535 1st St N",
"city": "Dolomite",
"state": "AL",
"postalCode": "35061",
"customFields": [
{
"key": "my_custom_field",
"field_value": "My Text"
},
],
"dateOfBirth": "1990-09-25",
"country": "MX",
});
let config = {
method: 'post',
url: 'https://services.leadconnectorhq.com/contacts/upsert',
headers: {
'Content-Type': 'application/json',
'Accept': 'application/json',
'Authorization': 'Bearer <API_KEY>'
},
data : data
};

axios.request(config)
.then((response) => {
console.log(JSON.stringify(response.data));
})
.catch((error) => {
console.log(error);
});
Response 200:
contact object schema:

- id: string example: seD4PfOuKoVMLkEZqohJ
- name: string
- locationId string
- firstName string
- lasName string
- email string
- phone string
- .....
Acción obligatoria
Guardar el ID del contacto en su base de datos.
Este ID será usado para:

Actualizar contacto
Marcar compra
Futuras modificaciones
Response 400
Schema:
statusCode number: example: 400
message string: example: Bad request
Response 401
Schema:
statusCode number: example: 401
message string: example: Invalid token: access token is invalid
error string: example: unauthorized
Response 422
Schema:
statusCode number: example: 422
message string: example: [“Unprocessable Entity”]
error string: example: Unprocessable Entity
2. Update Contact
Actualiza un contacto existente usando su contactId
Cuándo usarlo:

Pago existo de membresía y aprobación.
Actualización de datos futuras.
Endpoint
PUT https://services.leadconnectorhq.com/contacts/:contactId
Path parameters
contactId string
Request body
firstName string nullable
lastName string nullable
email string nullable
gender string nullable example: male or female
phone string nullable
adress1 string nullable
city string nullable
state string nullable
postalCode string nullable
country string nullable example: US or MX
dateOfBirth object nullable
Formatos soportados para dateOfBirth: YYYY/MM/DD, MM/DD/YYYY, YYYY-MM-DD,
MM-DD-YYYY, YYYY.MM.DD, MM.DD.YYYY, YYYY_MM_DD, MM_DD_YYYY
tags string[] Example [“miembro activo”]
Example request:
Node.js
AXIOS
const axios = require('axios');
let data = JSON.stringify({
"firstName": "Angel",
"lastName": "Nova",
"name": "Angel Nova",
"email": "angel@lyndoors.com",
"phone": "+1 888-888-8888",
"address1": "3535 1st St N",
"city": "Dolomite",
"state": "AL",
"postalCode": "35061",
"website": "https://www.tesla.com",
"tags": [
"miembro activo", ← IMPORTANTE AQUÍ : debe agregarse la etiqueta miembro activo
],
"customFields": [
{
"key": "my_custom_field",
"field_value": "My Text"
},
"dateOfBirth": "1990-09-25",
"country": "US",
"assignedTo": "y0BeYjuRIlDwsDcOHOJo"
});
let config = {
method: 'put',
url: 'https://services.leadconnectorhq.com/contacts/:contactId',
headers: {
'Content-Type': 'application/json',
'Accept': 'application/json',
'Authorization': 'Bearer <API_KEY>'
},
data : data
};
axios.request(config)
.then((response) => {
console.log(JSON.stringify(response.data));
})
.catch((error) => {
console.log(error);
});
En customFields agregar siguientes campos:

contact.tipo_membresia: si anual o mensual, poner alguno de esos dos
contact.costo_membresia: costo membresía $
Example:
"customFields": [
{
"key": "contact.tipo_membresia",
"field_value": "Mensual"
},
{
"key": "contact.costo_membresia",
"field_value": "$159"
},
]
Response 200:
Schema

Succeded boolean: example: true
contact object:
- id: string example: seD4PfOuKoVMLkEZqohJ
- name: string
- locationId string
- firstName string
- lasName string
- email string
- phone string
- .....
Acción obligatoria
Guardar el ID del contacto en su base de datos.
Este ID será usado para:
Actualizar contacto
Marcar compra
Futuras modificaciones
Response 400
Schema:
statusCode number: example: 400
message string: example: Bad request
Response 401
Schema:
statusCode number: example: 401
message string: example: Invalid token: access token is invalid
error string: example: unauthorized
Response 422
Schema:
statusCode number: example: 422
message string: example: [“Unprocessable Entity”]
error string: example: Unprocessable Entity
Regla de negocio
Solo llamar este endpoint cuando el pago sea existo y cuando el miembro sea
aprobado.
Flujo recomendado:
https://miro.com/app/board/uXjVKnoLXMY=/?share_link_id=
Buenas prácticas:

Llamadas solo desde backend
Guardar contactId
No llamar API desde frontend
IMPORTANTE:
Utilizar variables de entorno .env para el API_KEY y LOCATION_ID. Utilizando archivo .env
Token API KEY: pit-af973e1a-30aa-4643-8146-325d875b1f3e
LOCATION_ID: WSfoe3Cggh6XrHoGRMxG