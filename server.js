const express = require('express');
const ejs = require('ejs');
const mysql = require('mysql2/promise'); // Use promise-based MySQL
const session = require('express-session');

// Create a MySQL pool for database connections
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'jobPortal',
});

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

app.use(express.urlencoded({ extended: true }));
app.use(express.static('videos'));


app.get('/home', (req, res) => {
  res.render('home', {});
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Serve the registration form
app.get('/register', (req, res) => {
  res.render('registration', {});
});

app.get('/change', (req, res) => {
  if (req.session && req.session.username) {
    res.render('change', {});
  }
  else {
    res.redirect('/login');
  }
});

app.post('/change', async (req, res) => {
  if (req.session && req.session.username) {
    res.render('change', {});
  }
  else {
    res.redirect('/login');
  }
});

app.post('/save', async (req, res) => {
  const newp = req.body.new;
  const confirmp = req.body.confirm;

  if (newp === confirmp) {
    // Passwords match, proceed with the update
    const uid = req.session.uid; // Assuming you have a user ID in the session

    try {
      // Update the user's password in the database
      const connection = await pool.getConnection();
      await connection.execute('UPDATE users SET password = ? WHERE id = ?', [newp, uid]);

      res.send("<script>alert('Password Changed Successfully!'); window.location.href = '/profile'; </script>");

    } catch (error) {
      console.error('Error updating password:', error);
    }
  } else {
    // Passwords do not match
    console.log("Passwords don't match");
  }
});

app.get('/login', (req, res) => {
  if (req.session && req.session.username) {
    res.redirect('/user');
  }
  else {
    res.render('login', { msg: 'Login to Your Account' });
  }
});

app.get('/newLogin', (req, res) => {
  res.render('login', { msg: 'Registration Successfull ! Login to Your Account' });
});

app.get('/profile', (req, res) => {
  if (req.session && req.session.uid) {
    // The 'user' session variable is set
    username = req.session.username;
    usermobile = req.session.mobile;
    useremail = req.session.email;

    res.render('profile', { name: username, email: useremail, mobile: usermobile });
  } else {
    // The 'user' session variable is not set
    res.redirect('/login');
    console.log('failed');
  }
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
  try {
    const user = await authenticateUser(email, password);
    // console.log(user);
    
    if (user) {
      const username = user.name;
      const id = user.id;
      const mobile = user.mobile;
      const useremail = user.email;
      const pass = user.password;
      // Authentication successful
      req.session.username = username; // Store user data in the session
      req.session.uid = id; // Store user data in the session
      req.session.email = useremail; // Store user data in the session
      req.session.mobile = mobile; // Store user data in the session
      req.session.password = pass; // Store user data in the session
      console.log('Login Successful');
      res.redirect('/user');
    } else {
      // Authentication failed
      res.send("<script>alert('Login Failed !'); window.location.href = '/login'; </script>");
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
    const { name, email, password, mobile } = req.body;

    // Insert user registration data into the database
    const connection = await pool.getConnection();
    await connection.execute(
      'INSERT INTO users (name, email, password, mobile) VALUES (?, ?, ?, ?)',
      [name, email, password, mobile]
    );
    connection.release();

    console.log('Registration successful');
    res.redirect('/newLogin');
  } catch (error) {
    console.error('Error inserting data into the database:', error);
  }
});

// Display user information
app.get('/user', async (req, res) => {
  try {
    const un = req.session.username;
    res.render('user', { username: un });
    // Select data from the 'users' table (change the query as needed)
    const connection = await pool.getConnection();
    const id = req.session.uid;
    // console.log(id);
    const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);

    if (rows.length > 0) {

    } else {
      console.log('User Not Found');
    }
  } catch (error) {
    console.error('Error querying MySQL:', error);
  }
});

// Update User Profile
app.post('/update', async (req, res) => {
  try {
    // Select data from the 'users' table (change the query as needed)
    const connection = await pool.getConnection();
    const uid = req.session.uid;
    const { up_name, up_email, up_mobile } = req.body;
    console.log(up_email, up_mobile, up_name);

    const [result] = await connection.execute('UPDATE users SET name = ?, email = ?, mobile = ? WHERE id = ?', [up_name, up_email, up_mobile, uid]);

    if (result.affectedRows > 0) {
      req.session.username = up_name;
      req.session.email = up_email;
      req.session.mobile = up_mobile;
      res.send("<script>alert('Profile Updated Successfully!'); window.location.href = '/profile'; </script>");
      console.log('Profile Updated Successfully !');
    }
    else {
      console.log('Error while Updating Profile.');
    }

    // console.log('update');
  } catch (error) {
    console.error('Error querying MySQL:', error);
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});