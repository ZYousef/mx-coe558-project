// index.js
const express = require('express');
const bodyParser = require('body-parser');
const { Firestore } = require('@google-cloud/firestore');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

const app = express();

// Global CORS & preflight
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// JSON parser
app.use(bodyParser.json());

const db = new Firestore();
const collection = db.collection('genaiHistory');

// GraphQL schema
const schema = buildSchema(`
  type Item {
    id: String
    prompt: String
    resultUrl: String
    timestamp: Float
  }

  type Query {
    getItems: [Item]
    getItem(id: String!): Item
  }

  type Mutation {
    createItem(prompt: String!, resultUrl: String!): Item
    updateItem(id: String!, prompt: String!, resultUrl: String!): Item
    deleteItem(id: String!): Boolean
  }
`);

// GraphQL resolvers
const root = {
  getItems: async () => {
    const snapshot = await collection.orderBy('timestamp', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  getItem: async ({ id }) => {
    const doc = await collection.doc(id).get();
    if (!doc.exists) {
      throw new Error('Item not found');
    }
    return { id: doc.id, ...doc.data() };
  },
  createItem: async ({ prompt, resultUrl }) => {
    const doc = await collection.add({ prompt, resultUrl, timestamp: Date.now() });
    return { id: doc.id, prompt, resultUrl, timestamp: Date.now() };
  },
  updateItem: async ({ id, prompt, resultUrl }) => {
    await collection.doc(id).update({ prompt, resultUrl, timestamp: Date.now() });
    const updatedDoc = await collection.doc(id).get();
    return { id: updatedDoc.id, ...updatedDoc.data() };
  },
  deleteItem: async ({ id }) => {
    await collection.doc(id).delete();
    return true;
  },
};

// GraphQL endpoint
app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true, // Enable GraphiQL for testing
  })
);

// REST endpoints
app.get('/healthz', (req, res) => res.send('OK'));

// Create item
app.post('/items', async (req, res) => {
  const { prompt, resultUrl } = req.body;
  if (!prompt || !resultUrl) {
    return res.status(400).json({ error: 'prompt and resultUrl are required' });
  }
  const doc = await collection.add({ prompt, resultUrl, timestamp: Date.now() });
  res.status(201).json({ id: doc.id });
});

// Read all items
app.get('/items', async (req, res) => {
  const snapshot = await collection.orderBy('timestamp', 'desc').get();
  const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  res.json(items);
});

// Read one by ID
app.get('/items/:id', async (req, res) => {
  // Handle literal "{id}" path from CORS preflight forward fallback
  let id = req.params.id;
  if (id === '{id}' && req.query.id) {
    id = req.query.id;
  }
  try {
    const doc = await collection.doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Update item
app.put('/items/:id', async (req, res) => {
  const { id } = req.params;
  const { prompt, resultUrl } = req.body;
  try {
    await collection.doc(id).update({ prompt, resultUrl, timestamp: Date.now() });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete item
app.delete('/items/:id', async (req, res) => {
  let id = req.params.id;
  // Fallback for clients that send {id}?id= due to CORS route quirks
  if (id === '{id}' && req.query.id) {
    id = req.query.id;
  }
  try {
    await collection.doc(id).delete();
    return res.sendStatus(204);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`CRUD service listening on ${PORT}`));
