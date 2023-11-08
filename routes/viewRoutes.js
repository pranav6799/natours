const express = require('express')
const viewsController = require('../controllers/viewsController')
const authController = require('../controllers/authController')
const bookingController = require('../controllers/bookingsController')


const router = express.Router();


router.get('/',bookingController.createBookingCheckout,authController.protect, viewsController.getOverview )



router.get('/tour',authController.isLoggedIn,viewsController.getTour)
router.get('/tour/:slug',authController.isLoggedIn,viewsController.getTour)
router.get('/login',authController.isLoggedIn,viewsController.getLoginForm)
router.get('/me',authController.protect,viewsController.getAccount)
router.get('/my-tour',authController.protect,viewsController.getMyTour)



router.post('/submit-user-data',authController.protect,viewsController.updateUserData)
module.exports = router