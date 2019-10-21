const mongoose = require('mongoose');
const validator = require('validator');
const bycript = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error('It is not a valid email.');
      }
    }
  },
  age: {
    type: Number,
    default: 0,
    validate(value) {
      if (value < 0) {
        throw new Error('Age must be a positive number');
      }
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 7,
    trim: true,
    validate(value) {
      if (value.toLowerCase().includes('password')) {
        throw new Error('Password cannot contain password')
      }
    }
  },
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }],
  avatar: {
    type: Buffer
  }
}, {
  timestamps: true
});

userSchema.virtual('tasks', {
  ref: 'Task', // should be the same as the model we want to point
  localField: '_id', // key reference from user
  foreignField: 'owner' // key reference from task
})

// se crea una metodo para usaro desde un Modelo => User.<Method>
userSchema.statics.findByCredentials = async (email, password) => {

  const user = await User.findOne({
    email
  });

  if (!user) {
    throw new Error('Unable to login');
  }

  const isMatch = await bycript.compare(password, user.password);

  if (!isMatch) {
    throw new Error('Unable to login');
  }

  return user;

}
// se crea una metodo para usaro desde una instacia => user.<Method>
userSchema.methods.generateAuthToken = async function (params) {
  const user = this;
  console.log('user', user);
  const token = jwt.sign({
    _id: user.id.toString()
  }, process.env.JWT_SECRET, {
    expiresIn: '7 days'
  });

  user.tokens = user.tokens.concat({
    token
  });
  await user.save();

  return token;
}

// this method permite limpiar las propiedades del user cuando este se devuelve en una respuesta. Para esto siempre se debe usar toJSON
userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;

  return userObject;
}

//use pre for before and post for after. It is a middleware
userSchema.pre('save', async function (next) {
  const user = this;
  console.log('just before user is created/updated');
  if (user.isModified('password')) {
    user.password = await bycript.hash(user.password, 8);
  }
  next();
});

// Delete user tasks when user is removed
userSchema.pre('remove', async function (next) {
  const user = this
  await Task.deleteMany({
    owner: user._id
  })
  next()
})

const User = mongoose.model('User', userSchema);

module.exports = User;