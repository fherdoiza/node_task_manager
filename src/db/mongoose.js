const mongoose = require('mongoose');
const mongoURL = process.env.MONGO_URL;


mongoose.connect(mongoURL, {
  useUnifiedTopology: true,
  useCreateIndex: true,
  useNewUrlParser: true,
  useFindAndModify: false
});