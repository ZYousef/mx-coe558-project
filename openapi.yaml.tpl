swagger: "2.0"
info:
  title: coe558-unified-api
  description: Single API front for Weather, GenAI & CRUD
  version: 1.0.0

host: ${service_control}
schemes:
  - https

x-google-endpoints:
  - name: ${service_control}
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
        address: ${weather_backend_url}
        protocol: h2

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
        address: ${genai_backend_url}
        protocol: h2

  /items:
    get:
      summary: List saved items
      operationId: listItems
      responses:
        "200":
          description: OK
          schema:
            type: array
            items:
              type: object
      x-google-backend:
        address: ${crud_backend_url}/items
        protocol: h2

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
          schema:
            type: object
      x-google-backend:
        address: ${crud_backend_url}/items
        protocol: h2

  /items/{id}:
    parameters:
      - name: id
        in: path
        required: true
        type: string
    get:
      summary: Get an item by ID
      operationId: getItem
      responses:
        "200":
          description: OK
          schema:
            type: object
      x-google-backend:
        address: ${crud_backend_url}/items/{id}
        protocol: h2

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
          schema:
            type: object
      x-google-backend:
        address: ${crud_backend_url}/items/{id}
        protocol: h2

    delete:
      summary: Delete an item
      operationId: deleteItem
      responses:
        "204":
          description: No Content
      x-google-backend:
        address: ${crud_backend_url}/items/{id}
        protocol: h2