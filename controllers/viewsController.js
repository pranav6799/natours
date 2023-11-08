const Tour = require('../models/tourModel')
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError')
const User = require('../models/userModel');
const Booking = require('../models/bookingModel')
const {
  updateUser
} = require('./userController');




exports.getOverview = catchAsync(async (req, resp) => {
  //1) Get tour data from collection 
  const tours = await Tour.find()
  //2) Build Template
  //3) Render that template using tour data from 1)

  resp.status(200).render('overview', {
    title: 'All Tours',
    tours
  })
})

exports.getTour = catchAsync(async (req, resp, next) => {
  //1) Get the data for the requested tour(including review and guides)
  const tour = await Tour.findOne({
    slug: req.params.slug
  }).populate({
    path: 'reviews',
    field: 'review rating user'
  })

  if (!tour) {
    return next(new AppError('There is no tour with that name', 404))
  }


  resp.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  })
})



exports.getLoginForm = (req, resp) => {


  resp.status(200).render('login', {
    title: 'Log into your account'
  })
}


exports.getAccount = (req, resp) => {

  resp.status(200).render('account', {
    title: 'Your account'
  })
}
exports.getMyTour = catchAsync(async(req,resp,next)=>{
// 1) Find all bookings 
const bookings = await Booking.find({user:req.user.id})


//2) find tours with the returned ID's
const tourIDs = bookings.map(el=>el.tour)
const tours = await Tour.find({ _id :{$in: tourIDs}})

resp.status(200).render('overview',{
  title: 'My Tours',
  tours
})

})


exports.updateUserData = catchAsync(async (req, resp, next) => {
  const updatedUser = await User.findByIdAndUpdate(req.user.id, {
    name: req.body.name,
    email: req.body.email
  }, {
    new: true,
    runValidator: true
  })

  resp.status(200).render('account', {
    title: 'Your account',
    user: updatedUser
  })
})

