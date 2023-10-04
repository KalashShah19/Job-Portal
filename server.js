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
  password: 'root',
  database: 'jobPortal',
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static('videos'));

app.get('/home', (req, res) => {
  res.sendFile(__dirname + '/home.html'); // Replace with the actual path to your home.html file
});

// Serve the registration form
app.get('/register', (req, res) => {
  res.render('registration', {});
});

app.get('/login', (req, res) => {
  res.render('login', {});
});

// Function to authenticate a user
async function authenticateUser(email, password) {
  const connection = await pool.getConnection();
  try {
    const [rows, fields] = await connection.execute('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);

    if (rows.length === 0) {
      return null; // User not found or incorrect credentials
    }

    const user = rows[0];
    return user; // Authentication successful
  } catch (error) {
    console.error('Error authenticating user:', error);
    throw error;
  }
}

// Login route
app.post('/auth', async (req, res) => {
  const { email, password } = req.body;
  console.log(email,password);
  try {
    const user = await authenticateUser(email, password);
    console.log(user);

    if (user) {
      // Authentication successful
      req.session.user = { user }; // Store user data in the session
      console.log('Login Successful');
      res.redirect('/user');
    } else {
      // Authentication failed
      console.log('Login Failed');
    }
  } catch (error) {
    console.error('Error querying MySQL:', error);
    res.status(500).json({ message: error });
  }
});

// Handle form submission
app.post('/registration', async (req, res) => {
  try {
    const { name, email, password, number } = req.body;

    // Insert user registration data into the database
    const connection = await pool.getConnection();
    await connection.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, password]
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
    res.render('user', {});
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

