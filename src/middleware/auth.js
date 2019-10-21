const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
  console.log('middleware for:', req.method + ' ' + req.path);
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET); //'process.env.JWT_SECRET': this is the same key I used in generateAuthToken
    const user = await User.findOne({
      _id: decoded._id,
      'tokens.token': token
    });

    if (!user) {
      throw new Error("No user auth middleware");
    }
    req.token = token;
    req.user = user;

    next();
  } catch (error) {
    res.status(401).send({
      error: 'Please authenticate.'
    });
  }
};

module.exports = auth;