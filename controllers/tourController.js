const { query} = require('express')
const Tour = require('../models/tourModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const factory = require('./handlerFunction')
const multer = require('multer')
const sharp = require('sharp')


const multerStorage = multer.memoryStorage()

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true)
  } else {
    cb(new AppError('Not an image please upload only image', 400), false)
  }
}


const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
})


exports.uploadTourImages = upload.fields([
  {name:'imageCover',maxCount:1},
  {name:'images',maxCount:3}
])


exports.resizeTourImages = catchAsync( async (req,resp,next)=>{
console.log(req.files)

if (!req.files.imageCover || !req.files.images ) return next()

// 1) Cover Image
req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`
  await  sharp(req.files.imageCover[0].buffer)
  .resize(2000, 1333)
  .toFormat('jpeg')
  .jpeg({quality: 90})
  .toFile(`public/img/tours/${req.body.imageCover}`)
  

  // 2) Images
  req.files.images.forEach((file , i) => {
    
  });

  next()
})



exports.aliasTopTour = (req, resp, next) => {
  req.query.limit = '5';
  req.query.sort = '-price';
  req.query.fields = 'name,price,ratingAverage,summary';
  next();
}



// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

exports.getAllTours = factory.getAll(Tour)
exports.getTour = factory.getOne(Tour, {path:'reviews'})
exports.createTour = factory.createOne(Tour)
exports.updateTour = factory.updateOne(Tour)
exports.deleteTour = factory.deleteOne(Tour)


exports.getTourStats =catchAsync(async (req, resp,next) => {
  const stats = await Tour.aggregate([{
        $match: {
          ratingAverage: {
            $gte: 4.5
          }
        }
      },

      {
        $group: {
          _id: {
            $toUpper: '$difficulty'
          },
          numTours: {
            $sum: 1
          },
          numRatings: {
            $sum: '$ratingsQuantity'
          },
          avgRating: {
            $avg: '$ratingAverage'
          },
          avgPrice: {
            $avg: '$price'
          },
          maxPrice: {
            $max: '$price'
          },
          minPrice: {
            $min: '$price'
          }
        }
      },
      // {
      //   $sort: {$avgPrice: 1 }
      //  }
    ])
    resp.status(200).json({
      status: 'success',
      data: {
        stats
      }
    })
})



exports.getMonthlyPlan = catchAsync(async (req, resp,next) => {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([{
        $unwind: '$startDates'
      },

      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },

      {
        $group: {
          _id: {
            $month: '$startDates'
          },
          numtourStats: {
            $sum: 1
          },
          tours: {
            $push: '$name'
          }
        }
      },

      {
        $addFields: {
          month: '$_id'
        }
      },
      {
        $project: {
          _id: 0
        }
      },

      {
        $sort: {
          numtourStats: -1
        }
      },
      {
        $limit: 6
      }

    ])
    resp.status(200).json({
      status: 'success',
      data: {
        plan
      }
    })
})

// exports.getToursWithin = catchAsync(async(req,resp,next)=>{
//   const {distance, latlng, unit} = req.params
//   const [lat, lng] = latlng.split(',')
// const radius = unit ===  'mi'? distance/3963.2 : distance/6378.1

//   if(!lat || !lng) next(new AppError('Please provide latitute and longitude in format lat,lng',400))

//   const tours = await Tour.find({
//     startLocation:{ $geoWithin: {$centreSphere:[[lng,lat],radius] } }
//   })

//   resp.status(200).json({
//     status:'success',
//     results: tours.length,
//     data:{
//       data:tours
//     }
//   })
// })

exports.getToursWithin = catchAsync(async (req, resp, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    return next(new AppError('Please provide latitude and longitude in the format lat,lng', 400));
  }

  try {
    const tours = await Tour.find({
      startLocation: { $geoWithin: { $centerSphere: [[parseFloat(lng), parseFloat(lat)], radius] } }
    });

    resp.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours: tours // Assuming tours is an array of tour objects
      }
    });
  } catch (error) {
    return next(new AppError('Error finding tours', 500));
  }
});


exports.getDistances = catchAsync(async(req,resp,next)=>{
  const {latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi'? 0.00621371:0.001

  if (!lat || !lng) {
    return next(new AppError('Please provide latitude and longitude in the format lat,lng', 400));
  }

  const distances = await Tour.aggregate([
    {
      $geoNear:{
        near:{
          type:'Point',
          coordinates:[lng*1,lat*1]
        },distanceField:'distance',
        distanceMultiplier:0.001
      }
    },
  {
    $project :{
      distance:1,
      name:1
    }
  }
  ])
  resp.status(200).json({
    status: 'success',
    data: {
      tours: distances 
    }
  });

  
})
