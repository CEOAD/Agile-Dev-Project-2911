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
app.engine('hbs', hbs({ extname: '.hbs' }));
app.set('view engine', 'hbs');
app.use(express.static(__dirname + '/public'));
app.use(session({
	secret: "verygoodsecret",
	resave: false,
	saveUninitialized: true
}));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());


// Serve static files
app.use(express.static(__dirname + '/public'));
// ...

// Move these lines after the app.use() statement


  
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/Mainpage/MainPage.html');
});

app.get('/public/loginpage.html', (req, res) => {
  res.sendFile(__dirname + '/public/signup_page/signup_page.html');
});

app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/public/Mainpage/MainPage.html');
});

// Passport.js
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.findById(id, function (err, user) {
		done(err, user);
	});
});

passport.use(new LocalStrategy(function (username, password, done) {
	User.findOne({ username: username }, function (err, user) {
		if (err) return done(err);
		if (!user) return done(null, false, { message: 'Incorrect username.' });

		bcrypt.compare(password, user.password, function (err, res) {
			if (err) return done(err);
			if (res === false) return done(null, false, { message: 'Incorrect password.' });
			
			return done(null, user);
		});
	});
}));

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) return next();
	res.redirect('/login');
}

function isLoggedOut(req, res, next) {
	if (!req.isAuthenticated()) return next();
	res.redirect('/');
}

// ROUTES
app.get('/', isLoggedIn, (req, res) => {
	res.render("index", { title: "Home" });
  });
  
  app.get('/about', (req, res) => {
	res.render("index", { title: "About" });
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
		username: req.body.username,
		email: req.body.email,
		password: hashedPassword,
		dob: req.body.dob
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
		return res.redirect('/dashboard');
	  });
	} catch (error) {
	  console.error(error);
	  res.status(500).json({ error: 'Internal server error' });
	}
  });
  
  app.get('/login', isLoggedOut, (req, res) => {
	const response = {
	  title: "Login",
	  error: req.query.error
	}
  
	res.render('login', response);
  });
  
  app.post('/login', passport.authenticate('local', {
	successRedirect: '/',
	failureRedirect: '/login?error=true'
  }));
  
  app.get('/logout', function (req, res) {
	req.logout();
	res.redirect('/');
  });
  
  app.get('/dashboard', isLoggedIn, (req, res) => {
	const response = {
	  isAuthenticated: req.isAuthenticated(),
	  username: req.user.username
	};
	res.render('dashboard', response);
  });

  app.get('/authStatus', (req, res) => {
	res.json({ isAuthenticated: req.isAuthenticated() });
  });
  

  

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});






