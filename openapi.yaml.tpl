swagger: "2.0"
info:
  title: coe558-unified-api
  description: Single API front for Weather, GenAI & CRUD
  version: 1.0.0

# Enable CORS globally workaround https://stackoverflow.com/a/67678657

host: ${service_control}"
schemes:
  - https

x-google-endpoints:
  - name: "${service_control}"
    allowCors: true

paths:
  /weather:
    get:
      summary: Current weather
      operationId: getWeather
      parameters:
        - name: lat
          in: query
          required: true
          type: number
        - name: lon
          in: query
          required: true
          type: number
      responses:
        "200":
          description: OK
          schema:
            type: object
      x-google-backend:
        address: https://me-west1-coe558-project-458416.cloudfunctions.net/weather

  /generate:
    post:
      summary: Generate an image
      operationId: genImage
      consumes:
        - application/json
      produces:
        - application/json
      parameters:
        - in: body
          name: body
          required: true
          schema:
            type: object
            properties:
              prompt:
                type: string
      responses:
        "200":
          description: OK
          schema:
            type: object
      x-google-backend:
        address: https://me-west1-coe558-project-458416.cloudfunctions.net/generate

  /items:
    get:
      summary: List saved items
      operationId: listItems
      responses:
        "200":
          description: OK
          schema:
            type: array
      x-google-backend:
        address: https://crud-service-217890144082.me-west1.run.app/items

    post:
      summary: Save an item
      operationId: saveItem
      consumes:
        - application/json
      parameters:
        - in: body
          name: body
          required: true
          schema:
            type: object
            properties:
              prompt:
                type: string
              resultUrl:
                type: string
      responses:
        "200":
          description: OK
      x-google-backend:
        address: https://crud-service-217890144082.me-west1.run.app/items

  /items/{id}:
    parameters:
      - name: id
        in: path
        required: true
        type: string

    put:
      summary: Update an item
      operationId: updateItem
      consumes:
        - application/json
      parameters:
        - name: id
          in: path
          required: true
          type: string
        - in: body
          name: body
          required: true
          schema:
            type: object
            properties:
              prompt:
                type: string
              resultUrl:
                type: string
      responses:
        "200":
          description: OK
      x-google-backend:
        address: https://crud-service-217890144082.me-west1.run.app/items/{id}

    delete:
      summary: Delete an item
      operationId: deleteItem
      responses:
        "204":
          description: No Content
      x-google-backend:
        address: https://crud-service-217890144082.me-west1.run.app/items/{id}