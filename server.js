const express = require('express');
const ejs = require('ejs');
const mysql = require('mysql2/promise'); // Use promise-based MySQL
const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', __dirname);

app.use(express.json());

// Configure session options
app.use(session({
  secret: 'jobportalsession', // Replace with a secure secret key
  resave: false, // Don't save session data if not modified
  saveUninitialized: true, // Save new sessions
}));

// Create a MySQL pool for database connections
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'jobPortal',
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static('videos'));

app.get('/home', (req, res) => {
  res.sendFile(__dirname + '/home.html'); // Replace with the actual path to your home.html file
});

// Serve the registration form
app.get('/register', (req, res) => {
  var dynamicText = "Dynamic";
  res.render('registration', {});
});

app.get('/login', (req, res) => {
  res.render('login', {});
});

// Function to authenticate a user
async function authenticateUser(email, password) {
  const connection = await pool.getConnection();
  try {
    const [rows, fields] = await connection.execute(
      'SELECT * FROM users WHERE email = ? and password = ?',
      [email,password]
    );

    if (rows.length === 0) {
      return null; // User not found
    }
    else {
      const user = rows[0];
      return user;
    }
  } catch (error) {
    console.error('Error Authenticating User:', error);
    throw error;
  } finally {
    
  }
}

// Login route
app.post('/auth', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await authenticateUser(email, password);
    username = user[0].name;

    if (user) {
      // Authentication successful
      req.session.user = { username }; // Store user data in the session
      res.status(200).json({ message: 'Login successful', user });
      res.render('user', { username, id });
    } else {
      // Authentication failed
      res.status(401).json({ message: 'Login failed: Invalid credentials' });
    }
  } catch (error) {
    console.error('Error querying MySQL:', error);
    res.status(500).json({ message: error });
  }
});

// Handle form submission
app.post('/registration', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Insert user registration data into the database
    const connection = await pool.getConnection();
    await connection.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [username, email, password]
    );
    connection.release();

    console.log('Registration successful');
    res.redirect('/login');
  } catch (error) {
    console.error('Error inserting data into the database:', error);
    res.status(500).send('Registration failed');
  }
});

// Display user information
app.get('/user', async (req, res) => {
  try {
    // Select data from the 'users' table (change the query as needed)
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM users WHERE id = 1');
    connection.release();

    if (rows.length > 0) {

    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    console.error('Error querying MySQL:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

