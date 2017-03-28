'use strict';

const validator = require('validator');
const router = require('express').Router();
const ValidationError = require('expressjs-backend').ValidationError;

const UserRepository = require('../repositories/user-repository');
const environment = require('../environment');
const jwtHelper = require('../utils/jwt-helper');
const passwordHelper = require('../utils/password-helper');

module.exports = router;

router.post('/login', [login]);

function login(req, res, next) {
  let model = req.body;

  if (!model.email || !validator.isEmail(model.email))
    return res.status(400).json(new ValidationError('wrong_email'));

  if (!model.password || !environment.user.passwordPattern.test(model.password))
    return res.status(400).json(new ValidationError('wrong_password'));

  let userRepo = new UserRepository();
  let userId;

  userRepo.findByEmail(model.email)
    .then((user) => {
      if (!user)
        throw new ValidationError('wrong_username_password');

      userId = user.id;
      return passwordHelper.comparePassword(model.password, user.pwdHash);
    })
    .then((match) => {
      if (!match)
        throw new ValidationError('wrong_username_password');

      let data = {
        id: userId,
        lastLogonDate: new Date()
      };

      return userRepo.save(data);
    })
    .then(() => {
      return jwtHelper.getToken(userId)
    })
    .then((token) => {
      res.json(token);
    })
    .catch(next);
}
