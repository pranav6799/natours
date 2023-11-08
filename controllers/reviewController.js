const Review = require('../models/reviewModel')
// const catchAsync = require('../utils/catchAsync')
const factory = require('./handlerFunction')



exports.setTourUsersId = (req,resp,next)=>{
  // Allow Nested routes
  if(!req.body.tour) req.body.tour = req.params.tourId
  if(!req.body.user) req.body.user = req.user.id
  next()
}


exports.getAllReviews = factory.getAll(Review)
exports.createReviews = factory.createOne(Review)
exports.getReviews = factory.getOne(Review)
exports.updateReview=factory.updateOne(Review)
exports.deleteReview = factory.deleteOne(Review)