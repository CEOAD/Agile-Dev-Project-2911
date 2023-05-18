const mongoose = require('mongoose');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongodb-session')(session);
const hbs				= require('express-handlebars');
const LocalStrategy = require('passport-local').Strategy;
const passport			= require('passport');
const bcrypt			= require('bcrypt');
const app = express();
const port = 8000;
const uri = 'mongodb+srv://surf:surf@myweatheruserscluster.mjq0rxo.mongodb.net/?retryWrites=true&w=majority';


const userSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: [true, "email required"],
      unique: [true, "email already registered"],
    },
    firstName: String,
    lastName: String,
    profilePhoto: String,
    address: String,
    password: String,
    dob: { type: Date, required: true },
  }, { collection: 'myWeatherUsersv2' });


const User = mongoose.model('User', userSchema);


mongoose.connect(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true
});

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
  secret: "verygoodsecret",
  resave: false,
  saveUninitialized: true,
  store: new MongoStore({ uri, collection: 'sessions' }),
}));

// Passport.js
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

app.use(passport.initialize());
app.use(passport.session());

// Serve static files
app.use(express.static(__dirname + '/public'));




passport.use(new LocalStrategy({
	usernameField: 'email', // Specify the field name for email
	passwordField: 'password', // Specify the field name for password
  }, function (email, password, done) {
	User.findOne({ email: email }, function (err, user) {
		console.log('Email:', email);
		console.log('Password:', password);
		if (err) return done(err);
		if (!user) return done(null, false, { message: 'Incorrect email.' });

		bcrypt.compare(password, user.password, function (err, res) {
			if (err) return done(err);
			if (res === false) return done(null, false, { message: 'Incorrect password.' });
			
			return done(null, user);
		});
	});
}));



// ROUTES

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/public/Mainpage/MainPage.html');
  });
  
app.get('/authStatus', function (req, res) {
	if (req.isAuthenticated()) {
	  res.json({ message: 'You made it to the secured profile', isAuthenticated: true });
	} else {
	  res.json({ message: 'You are not authenticated', isAuthenticated: false });
	}
  });

app.post('/signup', async (req, res) => {
try {
	const { username, email, password, dob } = req.body;

	// Check if the username is already taken
	const existingEmail = await User.findOne({ email: req.body.email });
	if (existingEmail) {
	return res.status(400).json({ error: 'Email already in use.' });
	}

	// Hash the password
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password, salt);

	// Create a new user
	const newUser = new User({
	username: username,
	email: email,
	password: hashedPassword,
	dob: dob
	});

	// Save the user to the database
	await newUser.save();

	// Redirect or send a response indicating success
	// Redirect to the dashboard after successful signup
	req.login(newUser, function(err) {
	if (err) {
		console.error(err);
		return res.status(500).json({ error: 'Internal server error' });
	}
	return res.status(200).json({ success: true })
	});
} catch (error) {
	console.error(error);
	res.status(500).json({ error: 'Internal server error' });
}
});

app.post('/login', (req, res, next) => {
	passport.authenticate('local', (err, user, info) => {
	  if (err) {
		return res.status(500).json({ message: 'Internal server error' });
	  }
	  if (!user) {
		return res.status(401).json({ message: 'Login attempt failed' });
	  }
	  req.login(user, (err) => {
		if (err) {
		  return res.status(500).json({ message: 'Internal server error' });
		}
		// Handle successful login
		return res.status(200).json({ message: 'Login attempt successful', isAuthenticated: true });
	  });
	})(req, res, next);
  });
  
  
  
  
  app.get('/login-failure', (req, res, next) => {
	res.json({ message: 'Login Attempt Failed' });
  });
  
  app.get('/login-success', (req, res, next) => {
	console.log(req.session);
	const responseObj1 = { message: 'Login Attempt was successful' };
	const responseObj2 = { data: req.session.passport };
	const combinedResponse = { response1: responseObj1, response2: responseObj2 };
	console.log(combinedResponse.response1.message, combinedResponse.response2.data);
	res.json(combinedResponse);
  });
  
  
	
app.post('/logout', function(req, res, next) {
	req.logout(function(err) {
	  if (err) { return next(err); }
	  res.send({ message: 'Logged out successfully' });
	});
  });

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});







