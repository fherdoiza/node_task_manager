const express = require('express');
const router = new express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/user');
const multer = require('multer');
const sharp = require('sharp');
const {
  sendWelcomeEmail,
  sendCancelEmail
} = require('../emails/account');

//task with async/await
router.post('/users', async (req, res) => {
  console.log(req.body);
  const user = new User(req.body);
  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({
      user,
      token
    }); // 201 is the correct status for create response
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get('/users/me', authMiddleware, async (req, res) => {
  res.send(req.user);
});

router.get('/users/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findOne({ // User.findById
      _id: userId
    });
    if (!user) {
      return res.status(404).send();
    }
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch('/users/me', authMiddleware, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'age', 'password', 'email'];
  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update);
  });

  if (!isValidOperation) {
    return res.status(400).send({
      error: 'Invalid Updates'
    });
  }

  //get the user of the req.user is posible because the authMiddleware
  try {

    // this process allows to encrypt the password using a middleware function
    updates.forEach((update) => {
      req.user[update] = req.body[update];
    });

    await req.user.save();
    if (!req.user) {
      return res.status(404).send();
    }
    res.send(req.user);
  } catch (error) {
    res.status(400).send(error);
  }
});




router.patch('/users/:id', async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'age', 'password', 'email'];
  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update);
  });

  if (!isValidOperation) {
    return res.status(400).send({
      error: 'Invalid Updates'
    });
  }

  const userId = req.params.id;
  try {

    const user = await User.findById(userId);
    // this process allows to encrypt the password using a middleware function
    updates.forEach((update) => {
      user[update] = req.body[update];
    });

    await user.save();
    if (!user) {
      return res.status(404).send();
    }
    res.send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});


router.delete('/users/me', authMiddleware, async (req, res) => {
  //get the id of the req.user is posible because the authMiddleware
  const userId = req.user._id;
  try {
    const user = await User.findByIdAndDelete(userId);
    sendCancelEmail(user.email, user.name);
    if (!user) {
      return res.status(404).send();
    }
    // await req.user.remove(); sirve también para eliminar
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.delete('/users/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).send();
    }
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Upload files

const upload = multer({
  //dest: 'avatars', // carpeta donde se va a guardar // si está comentado lo podemos guardar en base de datos
  limits: { // para establecer los límites del archivo
    fileSize: 1000000
  },
  fileFilter(req, file, callback) { // tipos de archivos permitidos
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) { //!file.originalname.endsWith('.pdf')
      return callback(new Error('File must be a image jpg or png'));
    }
    callback(undefined, true);
  }
});

router.post('/users/me/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    //req.user.avatar = req.file.buffer;
    const buffer = await sharp(req.file.buffer).resize({
      width: 250,
      height: 250
    }).png().toBuffer(); // cambiamos la imagen a png y de tamaño
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(400).send({
      error: "No se pudo obtener la imagen"
    });
  }

}, (error, req, res, next) => {
  res.status(400).send({
    error: error.message
  });
});

router.delete('/users/me/avatar', authMiddleware, async (req, res) => {
  try {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    res.set('Content-Type', 'image/png');
    res.send(user.avatar);

  } catch (error) {
    res.status(404).send();
  }
});

// Login methods

router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    res.send({
      user,
      token
    });
  } catch (error) {
    res.status(403).send(error);
  }
});

router.post('/users/logout', authMiddleware, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();

    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

router.post('/users/logoutAll', authMiddleware, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();

    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

module.exports = router;