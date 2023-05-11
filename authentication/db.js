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

const hashPassword = async (password) => {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};



module.exports = User;