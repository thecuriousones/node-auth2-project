const router = require("express").Router();
const { checkUsernameExists, validateRoleName } = require('./auth-middleware');
const {JWT_SECRET} = require("../secrets"); // use this secret!
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../users/users-model.js')

router.post("/register", validateRoleName, (req, res, next) => {
  /**
    [POST] /api/auth/register { "username": "anna", "password": "1234", "role_name": "angel" }

    response:
    status 201
    {
      "user"_id: 3,
      "username": "anna",
      "role_name": "angel"
    }
   */

  const newUser = req.body;
  const rounds = process.env.BCRYPT_ROUNDS || 8;
  const hash = bcrypt.hashSync(newUser.password, rounds);

  newUser.password = hash

  console.log(newUser)

  User.add(newUser)
    .then(user =>{
      res.status(201).json(user)
    })
    .catch(error =>{
      console.log(error)
      next()
    })

  // try{
  //   const rounds = process.env.BCRYPT_ROUNDS || 8;
  //   const hash = bcrypt.hashSync(newUser.password, rounds);
  //   const newUser = await User.add({username:req.body.username, password:hash})
  //   res.status(201).json(newUser)
  // }catch(e){
  //   res.status(500).json({message:e.message})
  // }
});


router.post("/login", checkUsernameExists, (req, res, next) => {
  /**
    [POST] /api/auth/login { "username": "sue", "password": "1234" }

    response:
    status 200
    {
      "message": "sue is back!",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ETC.ETC"
    }

    The token must expire in one day, and must provide the following information
    in its payload:

    {
      "subject"  : 1       // the user_id of the authenticated user
      "username" : "bob"   // the username of the authenticated user
      "role_name": "admin" // the role of the authenticated user
    }
   */

    let { username, password } = req.body;

    User.findBy({ username })
      .then(([user]) => {
        if (user && bcrypt.compareSync(password, user.password)) {
          const token = makeToken(user)
          res.status(200).json({
            message: `${user.username} is back!`,
            token
          });
        } else {
          next({ status: 401, message: 'Invalid Credentials' });
        }
      })
      .catch(next);
});

function makeToken(user){
  const payload ={
    subject: user.user_id,
    username: user.username,
    role_name: user.role_name
  }
  const options = {
    expiresIn: '24h'
  }
  // eslint-disable-next-line no-undef
  return jwt.sign(payload , JWT_SECRET , options )
}

module.exports = router;
