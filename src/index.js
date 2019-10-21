const express = require('express');
require('./db/mongoose');

const userRouter = require('./routers/users');
const taskRouter = require('./routers/tasks');

const app = express();
const port = process.env.PORT;

/*
//Middleware example
  // middleware for maintenance mode

  app.use((req, res, next)=>{
    res.status(503).send('Site is currently down. Check back soon');
  })
*/
// to access to the json input data. For example for the post request
app.use(express.json());

//call user endpoints 
app.use(userRouter);

//call task endpoints 
app.use(taskRouter);


app.listen(port, () => {
  console.log('Server is up port', port);
});