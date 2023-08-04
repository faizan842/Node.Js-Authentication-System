const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({ secret: 'whorborvbsbowbsjdbv', resave: true, saveUninitialized: true }));

// MongoDB Connection
const dbURI = 'mongodb://localhost:27017/new'; // Replace 'new' with your desired database name
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB successfully');
});

// User Schema and Model
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
  if (req.session.user) {
    // User is already logged in, redirect to dashboard
    res.redirect('/dashboard');
  } else {
    // User is not logged in, show login page
    res.render('login');
  }
});

app.get('/register', (req, res) => {
  // Show the registration page
  res.render('register');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send('Username and password are required.');
  }

  try {
    // Check if the user exists in the database
    const user = await User.findOne({ username, password }).exec();

    if (!user) {
      return res.status(401).send('Invalid credentials. Please try again.');
    }

    // Set user session
    req.session.user = user;
    res.redirect('/dashboard'); // Redirect to the dashboard after successful login
  } catch (err) {
    console.error('Error finding user:', err);
    return res.status(500).send('An error occurred while processing your request.');
  }
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send('Username and password are required.');
  }

  try {
    // Check if the username already exists in the database
    const existingUser = await User.findOne({ username }).exec();
    if (existingUser) {
      return res.status(409).send('Username already exists. Please choose a different username.');
    }

    // Create and save the new user to the database
    const newUser = new User({ username, password });
    await newUser.save();

    req.session.user = newUser;
    res.redirect('/dashboard'); // Redirect to the dashboard after successful registration
  } catch (err) {
    console.error('Error saving new user:', err);
    return res.status(500).send('An error occurred while processing your request.');
  }
});

// Dashboard Route
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    // User is not logged in, redirect to login page
    res.redirect('/');
  } else {
    // User is logged in, show the dashboard
    res.render('dashboard', { user: req.session.user });
  }
});

// Logout Route
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/');
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
