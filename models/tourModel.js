const mongoose = require('mongoose')
const slug = require('slugify')
// const User = require('./userModel')


const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true,
    maxlength: [40, 'A tour name must have less or equal then 40 characters'],
    minlength: [10, 'A tour name must have more or equal then 10 characters']
  },

  slug: String,

  duration: {
    type: Number,
    required: [true, 'A tour must have a name']
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have a group size']
  },
  difficulty: {
    type: String,
    required: [true, 'A Tour must have a difficulty'],
    enum: {
      values: ['easy', 'medium', 'difficult'],
    }
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'A min rating should be more or equal then 1.0'],
    max: [5, 'A max rating should be less or equal then 5.0'],
    set:val => Math.round(val*10)/10
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price']
  },
  priceDiscount: {
    type: Number,
    validate: function (val) {
      return val < this.price
    }

  },
  summary: {
    type: String,
    trim: true,
    required: [true, 'A tour must have a description']
  },
  description: {
    type: String,
    trim: true
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have a cover image']
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false
  },
  startDates: [Date],

  secretTour: {
    type: Boolean,
    default: false
  },

  startLocation:{
    type:{
      type: String,
      default:'Point',
      enum:['Point']

    },
   coordinates: [Number],
   address:String,
   description:String
  },

  locations:[
  { type:{
    type:String,
    default:'Point',
    enum:['Point']
  },
  coordinates: [Number],
   address:String,
   description:String,
   day:Number

  }
],
guides:[
  {
    type: mongoose.Schema.ObjectId,
    ref:'User'
  }
],


},

{
  toJSON: {
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
});

tourSchema.index({price:1, ratingsAverage:-1})
tourSchema.index({slug:1})
tourSchema.index({startLocation: '2dsphere'})

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7
})


tourSchema.virtual('reviews',{
  ref:'Review',
  foreignField:'tour',
  localField:'_id'
})


// DOCUMENT MIDDLEWARE
tourSchema.pre('save', function (next) {
  this.slug = slug(this.name, {
    lower: true
  });
  next()
})

// tourSchema.pre('save', async function(next){
//   const guidesPromises = this.guides.map(async el=> await User.findById(el))
//   this.guides = await Promise.all(guidesPromises)
//   next()
// })


//QUERY MIDDLEWARE 
tourSchema.pre(/^find/, function (next) {
  this.find({
    secretTour: {
      $ne: true
    }
  })
  this.start = Date.now()
  next()
})

tourSchema.pre(/^find/,function(next){
  this.populate({
    path:'guides',
    select: '-__v -passwordChangedAt'
  })
  next()
})


tourSchema.post(/^find/, function (docs, next) {
  console.log(`${Date.now()-this.start}`)
  console.log(docs)
  next()
})



// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate',function(next){
//   this.pipeline().unshift({$match : {secretTour: {$ne : true}}});
//   next();
// })


const Tour = mongoose.model('Tour', tourSchema);


module.exports = Tour;