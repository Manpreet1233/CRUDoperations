const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = 5001;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configure the PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'user_data',
  password: 'Welcome123',
  port: 5430 // default PostgreSQL port
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.route('/data')
  .get(async (req, res) => {
    try {
      // Query the data from PostgreSQL
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM student');
      const data = result.rows;
      console.log(data)
      res.json(data);

      client.release();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred' });
    }
  })
  .post(async (req, res) => {
    try {
      const { firstName, lastName } = req.body;

      // Check if the user already exists
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM student WHERE first_name = $1 AND last_name = $2', [firstName, lastName]);
      const existingUser = result.rows.length > 0;

      if (existingUser) {
        res.status(400).json({ error: 'User already exists' });
      } else {
        // Insert the new user into the PostgreSQL database
        await client.query('INSERT INTO student (first_name, last_name) VALUES ($1, $2)', [firstName, lastName]);
        res.sendStatus(200);
      }

      client.release();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred' });
    }
  });

app.route('/data/:id')
  .delete(async (req, res) => {
    try {
      const { id } = req.params;

      const client = await pool.connect();
      await client.query('DELETE FROM student WHERE id = $1', [id]);
      client.release();

      res.sendStatus(200);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred' });
    }
  });
  app.route('/data/:id')
  .put(async (req, res) => {
    try {
      const { id } = req.params;
      const { firstName, lastName } = req.body;

      const client = await pool.connect();
      const result = await client.query('SELECT * FROM student WHERE id = $1', [id]);
      const existingUser = result.rows.length > 0;

      if (!existingUser) {
        res.status(404).json({ error: 'User not found' });
      } else {
        // Update the user's first name and last name
      await client.query('UPDATE student SET first_name = $1, last_name = $2 WHERE id = $3', [firstName, lastName, id]);
        res.sendStatus(200);
      }

      client.release();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred' });
    }
  });

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
