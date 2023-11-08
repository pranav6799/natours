const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema({
  tour:{
    type:mongoose.Schema.ObjectId,
    ref:'Tour',
    require:[true,'Bookings must belong to tour']
  },
  user:{
    type:mongoose.Schema.ObjectId,
    ref:'User',
    require:[true,'Bookings must belong to User']
  },
  price:{
    type:Number,
    require:[true,'Booking must have a price']
  },
  createdAt :{
    type:Date,
    default:Date.now()
  },
  paid:{
    type:Boolean,
    deafult:true
  }
})

bookingSchema.pre(/^find/,function(next){
  this.populate('user').populate({
    path:'tour',
    select:'name'
  })
  next()
})

const Booking = mongoose.model('Booking',bookingSchema)

module.exports = Booking