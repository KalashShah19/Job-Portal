const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
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
app.use('/uploads', express.static('images'));
app.use(express.static('images'));
app.use(express.static('resumes'));
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
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
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
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
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
      await connection.execute('UPDATE users SET password = ? where userId = ?', [newp, uid]);
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
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  if (req.session && req.session.usertype) {
    if (req.session.usertype == "client") {
      res.redirect('/user');
    }
    else if (req.session.usertype == "admin") {
      res.redirect('/admin');
    }
  }
  else {
    res.render('login', { msg: 'Login to Your Account' });
  }
});
app.get('/newLogin', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.render('login', { msg: 'Registration Successfull ! Login to Your Account' });
});

app.get('/profile', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  // console.log(req.session.uid);
  if (req.session.uid != null) {
    var usertype = req.session.usertype;
    var userId = req.session.uid;
    const connection = await pool.getConnection();
    const [data] = await connection.execute('SELECT * FROM `jobSeeker` join users on users.userId = jobSeeker.userId WHERE jobSeeker.userId = ?', [userId]);
    // console.log(data);
    res.render('profile', { data });
  } else {
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
      const id = user.userId;
      const usertype = user.usertype;
      // Authentication successful
      req.session.uid = id; // Store user data in the session
      req.session.username = username; // Store user data in the session
      req.session.usertype = usertype; // Store user data in the session
      console.log('Login Successful');
      if (usertype == "client") {
        res.redirect('/user');
      }
      else if (usertype == "admin") {
        res.redirect('/admin');
      }
      else if (usertype == "company") {
        res.redirect('/company');
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
      res.send("<script> alert('Registration Successful !'); window.document.location.href='/newLogin'; </script>");
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
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  try {
    if (req.session && req.session.usertype) {
      var usertype = req.session.usertype;
      if (usertype == "client") {
        const un = req.session.username;
        res.render('user', { username: un });
      }
      else if (usertype == "admin") {
        res.redirect('/admin');
      }
    }
    else {
      res.render('login', { msg: 'Login to Your Account' });
    }


  } catch (error) {
    console.error('Error querying MySQL:', error);
  }
});

// image upload
var up_image = "";
const img_storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images/'); // The folder where uploaded images will be stored
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original filename
    up_image = file.originalname;
  },
});

const img_upload = multer({ storage: img_storage });

// Update User Profile
app.post('/update', img_upload.single('image'), async (req, res) => {
  try {
    // Select data from the 'users' table (change the query as needed)
    const connection = await pool.getConnection();
    const uid = req.session.uid;
    const { up_name, up_email, up_mobile, up_address, up_skills, up_achievements, up_qualification, up_hobbies, up_certifications } = req.body;
    const [result] = await connection.execute(
      'UPDATE users SET name=?, mobile=?, email=? , address=? WHERE userId = ?',
      [up_name, up_mobile, up_email, up_address, uid]
    );
    if (req.file != null) {
      const [result2] = await connection.execute(
        'UPDATE jobSeeker SET image=?, qualification=?, achievements=?, certifications=?, hobbies=?, skills=? WHERE userId=?',
        [up_image, up_qualification, up_achievements, up_certifications, up_hobbies, up_skills, uid]
      );
      console.log('Image uploaded successfully !');
    } if (req.file == null) {
      const [result2] = await connection.execute(
        'UPDATE jobSeeker SET qualification=?, achievements=?, certifications=?, hobbies=?, skills=? WHERE userId=?',
        [up_qualification, up_achievements, up_certifications, up_hobbies, up_skills, uid]
      );
    }

    if (result.affectedRows > 0) {
      req.session.username = up_name;
      res.send("<script>alert('Profile Updated Successfully!'); window.location.href = '/profile'; </script>");
      console.log('Profile Updated Successfully !');
      console.log('');
    }
    else {
      console.log('Error while Updating Profile.');
    }
    // console.log('update');
  } catch (error) {
    console.error('Error Updating:', error);
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
      req.session.usertype = rows[0].usertype;
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
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  try {
    if (req.session && req.session.usertype) {
      var usertype = req.session.usertype;
      if (usertype == "admin") {

        const connection = await pool.getConnection();

        const [rows] = await connection.execute('SELECT * FROM users where usertype = "client" or usertype = "admin";');

        res.render('admin', { users: rows });
      }
      else if (usertype == "client") {
        res.redirect('/login');
      }
    }
    else {
      res.render('login', { msg: 'Login to Your Account' });
    }

  } catch (error) {
    console.error('Error fetching user data:', error);
  }
});

app.get('/delete', async (req, res) => {
  var id = req.query.id;
  const connection = await pool.getConnection();
  connection.execute('delete from users where userId = ?', [id]);
  res.send('<script> alert("User Deleted Successfully !"); window.document.location.href="admin";</script>');
});

app.get('/edit', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  var id = req.query.id;
  const connection = await pool.getConnection();
  const [data] = await connection.execute('SELECT * FROM users WHERE userId = ?', [id]);
  console.log(data);
  res.render('edit', { id: data[0].id, name: data[0].name, mobile: data[0].mobile, email: data[0].email, address: data[0].address });
});

app.get('/new', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.render('new');
});

app.post('/newAdmin', async (req, res) => {
  const { name, email, password, mobile, address } = req.body;
  // Insert user registration data into the database
  const connection = await pool.getConnection();
  await connection.execute(
    'INSERT INTO users (name, email, password, mobile, usertype, address) VALUES (?, ?, ?, ?, ?, ?)',
    [name, email, password, mobile, "admin", address]
  );
  console.log('New Admin Created');
  res.send("<script> alert('New Admin Created Successfully! !'); window.document.location.href='/admin'; </script>");
});

// Update User Data
app.post('/edited', async (req, res) => {
  try {
    // Select data from the 'users' table (change the query as needed)
    const connection = await pool.getConnection();
    const { up_id, up_name, up_email, up_mobile, up_address } = req.body;
    // console.log(up_email, up_mobile, up_name);
    const [result] = await connection.execute('UPDATE users SET name = ?, email = ?, mobile = ?, address = ? where userId = ?', [up_name, up_email, up_mobile, up_address, up_id]);
    if (result.affectedRows > 0) {
      res.send("<script>alert('User Updated Successfully!'); window.location.href = '/admin'; </script>");
      console.log('User Updated Successfully !');
    }
    else {
      console.log('Error while Updating user.');
    }
    // console.log('update');
  } catch (error) {
    console.error('Error Registering:', error);
  }
});

// Post Job
app.get('/post', async (req, res) => {
  const connection = await pool.getConnection();
  const [data] = await connection.execute('SELECT * FROM `company` join users on users.userId = company.userId WHERE company.userId = ?', [req.session.uid]);
  res.render('post', { data, uid: req.session.uid });
});

// Viwe all Jobs 
app.get('/jobs', async (req, res) => {
  const connection = await pool.getConnection();
  const [rows] = await connection.execute("SELECT *,jobs.jobId as id FROM jobs LEFT JOIN applications ON jobs.jobId = applications.jobId WHERE applications.jobId IS NULL");
  res.render('jobs', { jobs: rows });
});

// View Job Details
app.get('/job', async (req, res) => {
  var id = req.query.id;
  const connection = await pool.getConnection();
  // console.log(id);
  const [rows] = await connection.execute('SELECT * FROM jobs where jobId =  ?', [id]);
  res.render('job', { job: rows });
});

// View Job Details
app.get('/ajob', async (req, res) => {
  var id = req.query.id;
  const connection = await pool.getConnection();
  // console.log(id);
  const [rows] = await connection.execute('SELECT * FROM jobs where jobId =  ?', [id]);
  res.render('ajob', { job: rows });
});

// Insert new Job
app.post('/insert', async (req, res) => {
  const {
    jobRole,
    company,
    jobType,
    jobAddress,
    vacancy,
    category,
    salary,
    jobTiming,
    description,
    jobCriteria,
    status,
    startdate,
    endDate,
    hired,
  } = req.body;

  console.log(req.body);

  try {
    const connection = await pool.getConnection();

    // Insert data into the "jobs" table
    const insertQuery = `
      INSERT INTO jobs (jobRole, coId, jobType, jobAddress, vacancy, category, salary, jobTiming, description, skills, status, startdate, endDate, hired)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await connection.execute(insertQuery, [
      jobRole,
      company,
      jobType,
      jobAddress,
      vacancy,
      category,
      salary,
      jobTiming,
      description,
      jobCriteria,
      status,
      startdate,
      endDate,
      hired,
    ]);

    res.send("<script>alert('Job Posted Successfully!'); window.location.href = '/post'; </script>");
    console.log('Job posted successfully.');
  } catch (error) {
    res.send("<script>alert('Falied posting job!'); window.location.href = '/post'; </script>");
    console.error('Error posting job :', error);
  }
});

app.get('/apply', async (req, res) => {
  if (req.session.uid == null) {
    res.redirect('/login');
  } else {
    var uid = req.session.uid;
    var jobId = req.query.id;
    var insert = "INSERT INTO `applications` (`userId`, `jobId`, `appStatus`) VALUES (?, ?, 'pending');";
    const connection = await pool.getConnection();
    await connection.execute(insert, [uid, jobId]);
    res.send("<script>alert('Applied Successfully!'); window.location.href = '/jobs'; </script>");
  }
});

// View Job Details
app.get('/applied', async (req, res) => {
  if (req.session.uid == null) {
    res.redirect('/login');
  } else {
    var id = req.session.uid;
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM `applications` join jobs on jobs.jobId = applications.jobId WHERE applications.userId = ?', [id]);
    res.render('applied', { jobs: rows });
  }
});

// Search job 
app.post('/search', async (req, res) => {
  const query = req.body.query;
  const connection = await pool.getConnection();
  const [results] = await connection.execute('SELECT * FROM `jobs` WHERE jobRole = ? or company = ? or jobAddress = ?', [query, query, query]);
  res.render('search', { query, searchResults: results });
  // console.log(results);
  // console.log(query);
});

app.use(express.urlencoded({ extended: true }));

app.get('/newCompany', (req, res) => {
  res.render('newCompany', {});
});

app.get('/app', async (req, res) => {
  var userId = req.query.id;
  var a = req.query.a;
  const connection = await pool.getConnection();
  const [resumeName] = await connection.execute('SELECT * FROM `applications` join jobseeker on jobseeker.userId = applications.userId WHERE applications.appId = ?', [a]);
  const [data] = await connection.execute('SELECT * FROM `jobSeeker` join users on users.userId = jobSeeker.userId WHERE jobSeeker.userId = ?', [userId]);
  const text = 'Your Application has been Monitored. Wait for the Response';
  var toMail = data[0].email;
  emailNotification(text, toMail);
  // console.log(resumeName);
  res.render('app', { resumeName });
});

// Handle the form submission
app.post('/newCompany', img_upload.single('logo'), async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const {
      name,
      email,
      mobile,
      password,
      address,
      estDate,
      industry,
      speciality,
      type,
      employees,
      openJobs,
      hired,
      website,
      about,
    } = req.body;

    const [result] = await connection.execute(
      'INSERT INTO users (name, email, password, mobile, usertype, address) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, password, mobile, "company", address]
    );

    const userId = result.insertId;
    var logo = req.file.originalname;

    // Insert data into the company table
    const [result2] = await connection.execute(
      'INSERT INTO company (userId, logo, estDate, industry, speciality, type, employees, openJobs, hired, website, about) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, logo, estDate, industry, speciality, type, employees, openJobs, hired, website, about]);

    console.log('New Company added successfully');
    res.send("<script>alert('Company Registered Successfully!'); window.location.href = '/login'; </script>");

  } catch (error) {
    console.log('Error inserting company data:', error);
  }
});

// View Job Applications
app.get('/apps', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  if (req.session.uid == null) {
    res.redirect('/login');
  } else {
    var uid = req.session.uid;
    var coId = req.session.coId;
    const connection = await pool.getConnection();
    const [rows] = await connection.execute("SELECT *, app.appId as id, app.userId as uid FROM applications app INNER JOIN jobs job ON app.jobId = job.jobId INNER JOIN users usr ON app.userId = usr.userId INNER JOIN company com ON job.coId = com.coId WHERE com.coId = ? and (appStatus = 'pending' or appStatus  = 'monitored');", [coId]);
    res.render('apps', { apps: rows });
  }
});

// resume pdf upload
var up_pdf = "";
const pdf_storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'resumes/'); // The folder where uploaded images will be stored
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original filename
    up_pdf = file.originalname;
  },
});

const pdf_upload = multer({ storage: pdf_storage });

app.get('/newResume', (req, res) => {
  res.render('newResume', {});
});

app.post('/newResume', (req, res) => {
  res.render('newResume', {});
});

app.post('/resume', pdf_upload.single('resume'), async (req, res) => {
  var uid = req.session.uid;
  var resume = req.file.originalname;
  // console.log(resume);
  // console.log(userId);
  const connection = await pool.getConnection();
  await connection.execute('UPDATE jobseeker SET resume=? where userId = ?', [resume, uid]);
  console.log('Resume Uploaded Successfully');
  res.send("<script>alert('Resume Uploaded Successfully!'); window.location.href = '/profile'; </script>");
});

app.get('/company', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  try {
    if (req.session && req.session.usertype) {
      var usertype = req.session.usertype;
      var userId = req.session.uid;
      if (usertype == "company") {
        const connection = await pool.getConnection();
        const [data] = await connection.execute('SELECT * FROM `company` join users on users.userId = company.userId WHERE company.userId = ?', [userId]);
        const coId = data[0].coId;
        req.session.coId = coId; // Store user data in the session
        res.render('company', { data });
      }
    }
    else {
      res.render('login', { msg: 'Login to Your Account' });
    }
  } catch (error) {
    console.error('Error querying MySQL:', error);
  }
});

app.get('/jobsList', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  // console.log(req.session.uid);
  if (req.session.uid != null) {
  var coId = req.session.coId;
  const connection = await pool.getConnection();
  const [rows] = await connection.execute("SELECT * FROM jobs WHERE coId = ?;", [coId]);
  res.render('jobsList', { jobs: rows });
} else {
  res.redirect('/login');
  console.log('failed to load Job Seeker Proile');
}
});

// Function to send an email using Nodemailer
async function emailNotification(text, toMail) {
  try {
    // Create a Nodemailer transporter using SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: '20bmiit116@gmail.com', // Your Gmail email address
        pass: 'lszz pmyd owxc cdsp', // Your Gmail password or an App Password (recommended)
      },
    });

    // Email options
    let mailOptions = {
      to: toMail, // Recipient email address
      subject: 'Update Notification',
      text: text, // Text input parameter
    };

    // Send email
    let info = await transporter.sendMail(mailOptions);
    console.log('Update Notification Send');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

app.get('/acc', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  // console.log(req.session.uid);
  if (req.session.uid != null) {
  var id = req.query.id;
  var a = req.query.a;
  const connection = await pool.getConnection();
  // console.log(id);
  const text = 'Congratulations ! Your Application is Selected for Interview. Date and Timings will be Informed to You. Good Luck';
  const [rows] = await connection.execute('SELECT * FROM users WHERE userId = ?', [id]);
  // console.log(rows);
  var toMail = rows[0].email;
  emailNotification(text, toMail);
  connection.execute('update applications set appStatus = "accepted" where appId = ?', [a]);
  console.log("Accepted Application = ", a);
  res.send('<script> alert("Application Accepted!"); window.document.location.href="apps";</script>');
} else {
  res.redirect('/login');
  console.log('failed to load Job Seeker Proile');
}
});

app.get('/rej', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  // console.log(req.session.uid);
  if (req.session.uid != null) {
  var id = req.query.id;
  var a = req.query.a;
  const connection = await pool.getConnection();
  // console.log(id);
  const text = 'Sorry, Your Application was Rejected. Better Luck Next Time :)';
  const [rows] = await connection.execute('SELECT * FROM users WHERE userId = ?', [id]);
  // console.log(rows);
  var toMail = rows[0].email;
  emailNotification(text, toMail);
  connection.execute('update applications set appStatus = "rejected" where appId = ?', [a]);
  console.log("Rejected Application = ", a);
  res.send('<script> alert("Application Rejected!"); window.document.location.href="apps";</script>');
} else {
  res.redirect('/login');
  console.log('failed to load Job Seeker Proile');
}
});

app.get('/pass', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  // console.log(req.session.uid);
  if (req.session.uid != null) {
  var id = req.query.id;
  var a = req.query.a;
  const connection = await pool.getConnection();
  // console.log(id);
  const text = 'Congratulations ! Your Interview has been Passed and You are Hired. Job Details will be discussed later. Have a Nice One.';
  const [rows] = await connection.execute('SELECT * FROM users WHERE userId = ?', [id]);
  // console.log(rows);
  var toMail = rows[0].email;
  emailNotification(text, toMail);
  connection.execute('update applications set appStatus = "hired" where appId = ?', [a]);
  console.log("Hired Application = ", a);
  res.send('<script> alert("Applicant Hired!"); window.document.location.href="apps";</script>');
} else {
  res.redirect('/login');
  console.log('failed to load Job Seeker Proile');
}
});

app.get('/jsProfile', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  // console.log(req.session.uid);
  if (req.session.uid != null) {
    var usertype = req.session.usertype;
    var userId = req.query.id;
    var a = req.query.a;
    const connection = await pool.getConnection();
    connection.execute('update applications set appStatus = "monitored" where appId = ?', [a]);
    const [data] = await connection.execute('SELECT * FROM `jobSeeker` join users on users.userId = jobSeeker.userId WHERE jobSeeker.userId = ?', [userId]);
    // console.log(data);
    const text = 'Your Application has been Monitored. Wait for the Response';
    var toMail = data[0].email;
    emailNotification(text, toMail);
    res.render('jsProfile', { data });
  } else {
    res.redirect('/login');
    console.log('failed to load Job Seeker Proile');
  }
});

app.get('/editJob', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  // console.log(req.session.uid);
  if (req.session.uid != null) {
  var id = req.query.id;
  const connection = await pool.getConnection();
  const [data] = await connection.execute('SELECT * FROM `jobs` join company on company.coId = jobs.coId join users on users.userId = company.userId WHERE jobId = ?', [id]);
  // console.log(data);
  res.render('editJob', { data, id });
} else {
  res.redirect('/login');
  console.log('failed to load Job Seeker Proile');
}
});

app.post('/test', (req, res) => {
  var date = req.body;
  console.log(date);
});

app.post('/updateJob', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  // console.log(req.session.uid);
  if (req.session.uid != null) {
  try {
    const connection = await pool.getConnection();
    const jobIdToUpdate = req.query.id;
    console.log(jobIdToUpdate);
    const {
      jobRole,
      jobType,
      jobAddress,
      vacancy,
      category,
      salary,
      jobTiming,
      description,
      jobCriteria,
      status,
      startdate,
      endDate,
      hired
    } = req.body;

    // Perform the database update
    const [updatedRows] = await connection.execute(
      `UPDATE jobs
      SET jobRole = ?, jobType = ?, jobAddress = ?, vacancy = ?,
      category = ?, salary = ?, jobTiming = ?, description = ?, skills = ?, status = ?,
      startdate = ?, endDate = ?, hired = ?
      WHERE jobId = ?`,
      [
        jobRole, jobType, jobAddress, vacancy, category, salary,
        jobTiming, description, jobCriteria, status, startdate, endDate, hired, jobIdToUpdate
      ]
    );

   console.log("Job Updated Successfully!");
   res.send("<script>alert('Job Updated Successfully!'); window.location.href = '/jobsList'; </script>");

  } catch (error) {
    console.error('Error updating job:', error);
  }
} else {
  res.redirect('/login');
  console.log('failed to load Job Seeker Proile');
}
});

app.get('/viewjob', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  // console.log(req.session.uid);
  if (req.session.uid != null) {
  var id = req.query.id;
  const connection = await pool.getConnection();
  // console.log(id);
  const [rows] = await connection.execute('SELECT * FROM jobs where jobId =  ?', [id]);
  res.render('viewJob', { job : rows });
} else {
  res.redirect('/login');
  console.log('failed to load Job Seeker Proile');
}
});

// View accepted Applications
app.get('/accepted', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  if (req.session.uid == null) {
    res.redirect('/login');
  } else {
    var uid = req.session.uid;
    var coId = req.session.coId;
    const connection = await pool.getConnection();
    const [rows] = await connection.execute("SELECT *, app.appId as id, app.userId as uid FROM applications app INNER JOIN jobs job ON app.jobId = job.jobId INNER JOIN users usr ON app.userId = usr.userId INNER JOIN company com ON job.coId = com.coId WHERE com.coId = ? and appStatus = 'accepted';", [coId]);
    res.render('accepted', { apps : rows });
  }
});

// View hired Applications
app.get('/hired', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.session.uid == null) {
    res.redirect('/login');
  } else {
    var uid = req.session.uid;
    var coId = req.session.coId;
    const connection = await pool.getConnection();
    const [rows] = await connection.execute("SELECT *, app.appId as id, app.userId as uid FROM applications app INNER JOIN jobs job ON app.jobId = job.jobId INNER JOIN users usr ON app.userId = usr.userId INNER JOIN company com ON job.coId = com.coId WHERE com.coId = ? and appStatus = 'hired';", [coId]);
    res.render('hired', { apps : rows });
  }
});

// View rejetced Applications 
app.get('/rejected', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  if (req.session.uid == null) {
    res.redirect('/login');
  } else {
    var uid = req.session.uid;
    var coId = req.session.coId;
    const connection = await pool.getConnection();
    const [rows] = await connection.execute("SELECT *, app.appId as id, app.userId as uid FROM applications app INNER JOIN jobs job ON app.jobId = job.jobId INNER JOIN users usr ON app.userId = usr.userId INNER JOIN company com ON job.coId = com.coId WHERE com.coId = ? and appStatus = 'rejected';", [coId]);
    res.render('rejected', { apps : rows });
  }
});

// Create a route to fetch and display user data
app.get('/companies', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  try {
    if (req.session && req.session.usertype) {
      var usertype = req.session.usertype;
      if (usertype == "admin") {

        const connection = await pool.getConnection();

        const [rows] = await connection.execute('SELECT * FROM users where usertype = "company";');

        res.render('companies', { users: rows });
      }
      else if (usertype == "client") {
        res.redirect('/login');
      }
    }
    else {
      res.render('login', { msg: 'Login to Your Account' });
    }

  } catch (error) {
    console.error('Error fetching user data:', error);
  }
});

app.get('/test', (req, res) => {
  res.render('test', {});
});

// run application 
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});