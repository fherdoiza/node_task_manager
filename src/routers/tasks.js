const express = require('express');
const router = new express.Router();
const Task = require('../models/task');
const authMiddleware = require('../middleware/auth');

//task with promises
router.post('/tasks', authMiddleware, async (req, res) => {

  const newTask = new Task({
    ...req.body,
    owner: req.user._id
  });

  newTask.save().then(() => {
    res.status(201).send(newTask);
  }).catch((error) => {
    res.status(400).send(error);
  });
});


router.get('/tasks', (req, res) => {
  Task.find({}).then((tasks) => {
    res.send(tasks);
  }).catch((error) => {
    res.status(500).send(error);
  });
});

/*
router.get('/tasks/me', authMiddleware, (req, res) => {
  Task.find({ // or await req.user.populate('tasks').execPopulate();
    owner: req.user._id 
  }).then((tasks) => {
    res.send(tasks); // if you use the await change to this res.send(req.user.tasks);
  }).catch((error) => {
    res.status(500).send(error);
  });
});
*/

// GET /tasks/me
// GET /tasks/me?completed=true
// GET /tasks/me?limit=5&skip=2
// GET /tasks/me?sortBy=createdAt:asc  // ?sortBy=createdAt:desc
router.get('/tasks/me', authMiddleware, async (req, res) => {

  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed === "true" ? true : false;
  }

  if (req.query.sortBy) {
    const sortParts = req.query.sortBy.split(':');
    sort[sortParts[0]] = sortParts[1] === 'desc' ? -1 : 1;
  }

  try {
    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
    }).execPopulate();
    res.send(req.user.tasks);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get('/tasks/:id', authMiddleware, (req, res) => {
  const taskId = req.params.id;
  Task.findOne({
    _id: taskId,
    owner: req.user._id
  }).then((task) => {
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  }).catch((error) => {
    res.status(500).send(error);
  });
});


router.patch('/tasks/:id', async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['description', 'completed'];
  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update);
  });

  if (!isValidOperation) {
    return res.status(400).send({
      error: 'Invalid Updates'
    });
  }

  const taskId = req.params.id;
  try {
    const task = await Task.findByIdAndUpdate(
      taskId,
      req.body, {
        new: true,
        runValidators: true
      }
    );

    if (!task) {
      return res.status(404).send();
    }
    res.send(task);

  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete('/tasks/:id', async (req, res) => {
  const taskId = req.params.id;
  try {
    const task = await Task.findByIdAndDelete(taskId);
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;