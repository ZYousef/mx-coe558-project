// index.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');       
const { Firestore } = require('@google-cloud/firestore');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = new Firestore();
const collection = db.collection('genaiHistory');

app.get('/healthz', (req, res) => res.send('OK'));


// Create
app.post('/items', async (req, res) => {
  const { prompt, resultUrl } = req.body;
  if (!prompt || !resultUrl) {
    return res.status(400).json({ error: 'prompt and resultUrl are required' });
  }
  const doc = await collection.add({ prompt, resultUrl, timestamp: Date.now() });
  res.status(201).json({ id: doc.id });
});

// Read all
app.get('/items', async (req, res) => {
  const snapshot = await collection.orderBy('timestamp','desc').get();
  const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  res.json(items);
});

// Read one
app.get('/items/:id', async (req, res) => {
  const doc = await collection.doc(req.params.id).get();
  if (!doc.exists) return res.status(404).send('Not found');
  res.json({ id: doc.id, ...doc.data() });
});

// Update
app.put('/items/:id', async (req, res) => {
  await collection.doc(req.params.id).update(req.body);
  res.sendStatus(204);
});

// Delete
app.delete('/items/:id', async (req, res) => {
  await collection.doc(req.params.id).delete();
  res.sendStatus(204);
});


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`CRUD service listening on ${PORT}`));