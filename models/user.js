const { Schema, model } = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const userSchema = Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minLength: 6
  },
  image: {
    type: String,
    required: true
  }
  // places:
})

userSchema.plugin(uniqueValidator)

module.exports = model('User', userSchema)