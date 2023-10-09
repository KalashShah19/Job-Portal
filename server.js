const nodemailer = require('nodemailer');
const express = require('express');
const ejs = require('ejs');
const mysql = require('mysql2/promise');
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


// Serve the forgot password form
app.get('/forgot', (req, res) => {
  res.render('forgot', {});
});

app.get('/check', (req, res) => {
  res.render('check', {});
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
  if (req.session && req.session.usertype) {
    if (usertype == "client") {
      res.redirect('/user');
    }
    else if (usertype == "admin") {
      res.redirect('/admin');
    }
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
    useraddress = req.session.address;
    usertype = req.session.usertype;

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
      const usertype = user.usertype;
      const address = user.address;

      // Authentication successful
      req.session.username = username; // Store user data in the session
      req.session.uid = id; // Store user data in the session
      req.session.email = useremail; // Store user data in the session
      req.session.mobile = mobile; // Store user data in the session
      req.session.password = pass; // Store user data in the session
      req.session.usertype = usertype; // Store user data in the session
      req.session.address = address; // Store user data in the session
      console.log('Login Successful');
      if (usertype == "client") {
        res.redirect('/user');
      }
      else if (usertype == "admin") {
        res.redirect('/admin');
      }
    } else {
      // Authentication failed
      res.send("<script>alert('Login Failed !'); window.location.href = '/login'; </script>");
      console.log('Login Failed');
    }
  } catch (error) {
    console.error('Error querying MySQL:', error);
  }
});

// Handle form submission
app.post('/registration', async (req, res) => {
  try {
    const { name, email, password, mobile, address } = req.body;

    var flag = true;
    //Validation of inputs
    if (!/^[A-Za-z\s]+$/.test(name)) {
      flag = false;
      console.log('name invalid');
      res.send('<script> Name should contain only letters and spaces !</script>');
    }

    if (address.length > 500) {
      flag = false;
      console.log('Address Too long');
      res.send("<script> alert('Address can be maximum of 500 characters only.'); window.document.location.href='register'; </script>");
    }

    if (password.length < 6) {
      flag = false;
      console.log('Password Invalid');
      res.send("<script> alert('Password should be atleadt 6 Characters Long'); window.document.location.href='register'; </script>");
    }

    if (flag == true) {
      // Insert user registration data into the database
      const connection = await pool.getConnection();
      await connection.execute(
        'INSERT INTO users (name, email, password, mobile, usertype, address) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, password, mobile, "client", address]
      );

      console.log('Registration successful');
      res.send("<script> alert('Registration Successful !');  window.document.location.href='/newLogin'; </script>");
    }
    else {
      res.send("<script> alert('Invalid Inputs !'); </script>");
    }
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
    // console.log(up_email, up_mobile, up_name);

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
    console.error('Error Registering:', error);
  }
});

// Gmail SMTP configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: '20bmiit116@gmail.com', // Your Gmail email address
    pass: 'lszz pmyd owxc cdsp', // Your Gmail password or an App Password (recommended)
  },
});

// Express.js route to send an email
app.post('/OTP', async (req, res) => {
  const email = req.body.email;
  const sub = "Login OTP for Online Job Portal";
  const OTP = Math.floor((Math.random() * 9999) + 1000).toString();
  console.log("OTP = ", OTP);
  console.log("mail = ", email);
  var flag = null;

  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      flag = false;
    }
    else {
      flag = true;
      // console.log(rows);
      // console.log('name = ',rows[0].name);
      req.session.username = rows[0].name;
      req.session.uid = rows[0].id; // Store user data in the session
      req.session.email = rows[0].email; // Store user data in the session
      req.session.mobile = rows[0].mobile; // Store user data in the session
      req.session.password = rows[0].password; // Store user data in the session
    }

  } catch (error) {
    console.error('Error finding email :', error);
    throw error;
  }

  const mailOptions = {
    from: '20bmiit116@gmail.com', // Sender's Gmail email address
    to: email, // Recipient's email address
    subject: sub,
    text: OTP,
  };

  if (flag == true) {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('OTP Email sent!');
        req.session.otp = OTP;
        res.redirect('/check');
      }
    });
  } else {
    console.log('Email Not Found');
    res.send("<script> alert('Email Not Found !'); window.document.location.href='forgot';</script>");
  }
});

app.post('/checkotp', async (req, res) => {
  const otp = req.session.otp;
  console.log('otp = ', otp);
  const input = req.body.input;
  if (otp == input) {
    console.log('OTP Correct');
    res.send("<script> alert('Login Successfull !'); window.document.location.href='user';</script>");
  }
  else {
    console.log('Wrong OTP!');
    res.send("<script> alert('Wrong OTP !'); window.document.location.href='check';</script>");
  }
});

// Create a route to fetch and display user data
app.get('/admin', async (req, res) => {
  try {
    // Create a MySQL connection
    const connection = await pool.getConnection();

    // Perform a SELECT query to fetch user data
    const [rows] = await connection.execute('SELECT * FROM users'); 

    // Render the EJS template and pass the fetched data
    res.render('admin', { users: rows });
    
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
});

app.get('/delete', async (req, res) => {
  var id = req.query.id;
  const connection = await pool.getConnection();
  connection.execute('delete from users where id = ?', [id]);
  res.send('<script> alert("User Deleted Successfully !"); window.document.location.href="admin";</script>');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});