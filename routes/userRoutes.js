const express = require('express');
const userController = require('../controllers/userController')
const authController = require('../controllers/authController');
const handlerFunction = require('../controllers/handlerFunction')


const router = express.Router();

router.post('/signup',authController.signUp)
router.post('/login',authController.login)
router.get('/logout',authController.logout)
router.post('/forgotPassword',authController.forgotPassword)
router.patch('/resetPassword/:token',authController.resetPassword)

//Protect all routes after this middleware
router.use(authController.protect)

router.patch('/updateMyPassword',
 authController.protect,
 authController.updatePassword)

router.get('/me',
 userController.getMe,
 userController.getUsers)

router.patch('/updateMe',userController.uploadUserPhoto,userController.resizeUserPhoto,userController.updateMe)

router.delete('/deleteMe', userController.deleteMe)

// All the routes below this middleware has to access to admins only
router.use(authController.restrictTo('admin'))

router
.route('/')
.get(userController.getAllUsers)
.post(userController.createUsers);

router
.route('/:id')
.get(userController.getUsers)
.patch(userController.updateUsers)
.delete(userController.deleteUsers);


module.exports = router












