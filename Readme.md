# COE558 Cloud Functions Endpoints

Currently implemented:

---

## Weather Service

**Endpoint**
```
GET https://me-west1-coe558-project-458416.cloudfunctions.net/weather
```

### Request (Postman)
```
GET /weather?lat=24.7136&lon=46.6753 HTTP/1.1
Host: me-west1-coe558-project-458416.cloudfunctions.net
Accept: application/json
```

### Sample Response
```json
{
  "latitude": "24.7136",
  "longitude": "46.6753",
  "temperature": 41.2,
  "windspeed": 3.4,
  "winddirection": 270,
  "weathercode": 0
}
```

---

## GenAI Service

**Endpoint**
```
POST https://me-west1-coe558-project-458416.cloudfunctions.net/generate
```

### Request (Postman)
```
POST /generate HTTP/1.1
Host: me-west1-coe558-project-458416.cloudfunctions.net
Content-Type: application/json

{
  "prompt": "an astronaut riding a horse"
}
```

### Sample Response
```json
{
  "result": "https://generated-image-url.example.com/abcd1234.png"
}
```

