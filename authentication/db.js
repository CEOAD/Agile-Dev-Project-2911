const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const uri = 'mongodb+srv://surf:surf@myweatheruserscluster.mjq0rxo.mongodb.net/?retryWrites=true&w=majority'


const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  dob: { type: Date, required: true },
  password: { type: String, required: true },
}, { collection: 'myWeatherusers' });

const User = mongoose.model('User', userSchema);


const hashPassword = (password) => {
return bcrypt.hash(password, 10);
};

module.exports = User;


  