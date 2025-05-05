# COE558 Cloud Functions Endpoints

## Terraform
### Cloud Build
1. clone this repo to cloud shell
2. gcloud services enable cloudresourcemanager.googleapis.com \
  --project=PROJECT
3. initiate and apply terraform
```
cd terraform
terraform init
terraform apply

Enter OPEN_API KEY ( hidden input )
Enter Project ID 
```

### Cloud Teardown
```
terraform destroy
```
if genapikey requested enter anyd data

then afterwards delete left-out api 
```
gcloud api-gateway apis delete coe558-api   --project=PROJECT_ID
gcloud services disable firestore.googleapis.com --project=PROJECT_ID
```
---
## Working Demo
Frontend
https://frontend-767937937782.us-central1.run.app/

API Gateway
https://coe558-gateway-9ssaf52u.uc.gateway.dev

CRUD Service
https://crud-service-767937937782.us-central1.run.app

Weather API
https://us-central1-edge-1000.cloudfunctions.net/weather

GenAI API
https://us-central1-edge-1000.cloudfunctions.net/genai

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

{ "prompt": "an astronaut riding a horse" }
```

### Sample Response
```json
{ "result": "https://generated-image-url.example.com/abcd1234.png" }
```

---

## CRUD Service

**Base URL**
```
https://crud-service-217890144082.me-west1.run.app
```

### Health Check

**Endpoint**
```
GET /healthz
```
**Request (Postman)**
```
GET /healthz HTTP/1.1
Host: crud-service-217890144082.me-west1.run.app
Accept: text/plain
```
**Sample Response**
```
OK
```

---

### Create Item

**Endpoint**
```
POST /items
```
**Request (Postman)**
```
POST /items HTTP/1.1
Host: crud-service-217890144082.me-west1.run.app
Content-Type: application/json

{
  "prompt": "a cat in a hat",
  "resultUrl": "https://img.example.com/cat.png"
}
```
**Sample Response (201 Created)**
```json
{ "id": "AbC123XyZ" }
```

---

### List Items

**Endpoint**
```
GET /items
```
**Request (Postman)**
```
GET /items HTTP/1.1
Host: crud-service-217890144082.me-west1.run.app
Accept: application/json
```
**Sample Response**
```json
[
  {
    "id": "AbC123XyZ",
    "prompt": "a cat in a hat",
    "resultUrl": "https://img.example.com/cat.png",
    "timestamp": 1714412345678
  }
]
```

---

### Get Item

**Endpoint**
```
GET /items/:id
```
**Request (Postman)**
```
GET /items/AbC123XyZ HTTP/1.1
Host: crud-service-217890144082.me-west1.run.app
Accept: application/json
```
**Sample Response**
```json
{
  "id": "AbC123XyZ",
  "prompt": "a cat in a hat",
  "resultUrl": "https://img.example.com/cat.png",
  "timestamp": 1714412345678
}
```

---

### Update Item

**Endpoint**
```
PUT /items/:id
```
**Request (Postman)**
```
PUT /items/AbC123XyZ HTTP/1.1
Host: crud-service-217890144082.me-west1.run.app
Content-Type: application/json

{ "prompt": "an updated prompt" }
```
**Sample Response (204 No Content)**
```
(no body)
```

---

### Delete Item

**Endpoint**
```
DELETE /items/:id
```
**Request (Postman)**
```
DELETE /items/AbC123XyZ HTTP/1.1
Host: crud-service-217890144082.me-west1.run.app
```
**Sample Response (204 No Content)**
```
(no body)
```

