const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const Tour = require('../models/tourModel')
const Booking = require('../models/bookingModel')
const authController = require('../controllers/authController')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const factory = require('./handlerFunction')



exports.getCheckoutSession = catchAsync(async (req,resp,next) => {
//1) Get currently booked tour
const tour = await Tour.findById(req.params.tourId)
console.log(tour)

//2) Create checkout session
const session = await stripe.checkout.session.create({
  payment_method_types:['card'],
  success_url:`${req.protocol}://${req.get('host')}/`,
  cancel_url:`${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
  customer_email: req.user.customer_email,
  client_reference_id: req.params.tourId,
  line_items:[
    {
      name:`${tour.name} Tour`,
      description: tour.summary,
      images:[`http://127.0.0.1:8000/img/tours/${tour.imageCover}`],
      amount:tour.price *100,
      currency:'usd',
      quantity: 1
    }
    
  ]
  
})
console.log(session)

//3) Create session as response
resp.status(200).json({
  status:'success',
  session
})
})

exports.createBookingCheckout = catchAsync(async(req,resp,next)=>{
// This is only Temporary because its unsecure everyone can make bookings without paying 
const {tour, user, price} = req.query

if(!tour && !user && !price) return next()
await Booking.create({tour,user,price})

resp.redirect(req.originalUrl.split('?')[0])
})


exports.createBooking = factory.createOne(Booking)
exports.getBooking = factory.getOne(Booking)
exports.getAllBooking = factory.getAll(Booking)
exports.updateBooking = factory.updateOne(Booking)
exports.deleteBooking = factory.deleteOne(Booking)

