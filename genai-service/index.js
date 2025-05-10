require('dotenv').config();
const cors = require('cors');
const axios = require('axios');
const { graphql, buildSchema } = require('graphql');

// Create a CORS middleware with permissive origin
const corsHandler = cors({ origin: true });

// GraphQL schema and resolver
const schema = buildSchema(`
  type Query {
    generateImage(prompt: String!): String
  }
`);

const root = {
  generateImage: async ({ prompt }) => {
    if (!prompt) {
      throw new Error('Missing prompt');
    }

    try {
      const resp = await axios.post(
        'https://api.openai.com/v1/images/generations',
        { prompt, n: 1, size: '1024x1024' },
        { headers: { Authorization: `Bearer ${process.env.GENAI_API_KEY}` } }
      );
      return resp.data.data[0].url;
    } catch (err) {
      console.error(err.response?.data || err.message);
      throw new Error('GenAI request failed');
    }
  },
};

exports.generate = (req, res) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  // Apply CORS middleware to actual request
  corsHandler(req, res, async () => {
    if (req.method === 'POST' && req.headers['content-type'] === 'application/json') {
      const { query, variables } = req.body;

      // Check if it's a GraphQL request
      if (query) {
        try {
          const result = await graphql({
            schema,
            source: query,
            rootValue: root,
            variableValues: variables,
          });
          res.set('Access-Control-Allow-Origin', '*');
          return res.status(200).json(result);
        } catch (err) {
          console.error(err.message);
          res.set('Access-Control-Allow-Origin', '*');
          return res.status(500).json({ error: 'GraphQL request failed' });
        }
      }

      // Handle REST API request
      const { prompt } = req.body || {};
      if (!prompt) {
        res.set('Access-Control-Allow-Origin', '*');
        return res.status(400).json({ error: 'Missing prompt in request body' });
      }

      try {
        const resp = await axios.post(
          'https://api.openai.com/v1/images/generations',
          { prompt, n: 1, size: '1024x1024' },
          { headers: { Authorization: `Bearer ${process.env.GENAI_API_KEY}` } }
        );
        const url = resp.data.data[0].url;
        res.set('Access-Control-Allow-Origin', '*');
        return res.status(200).json({ result: url });
      } catch (err) {
        console.error(err.response?.data || err.message);
        res.set('Access-Control-Allow-Origin', '*');
        return res.status(500).json({ error: 'GenAI request failed' });
      }
    } else {
      res.set('Access-Control-Allow-Origin', '*');
      return res.status(405).send('Only POST allowed');
    }
  });
};