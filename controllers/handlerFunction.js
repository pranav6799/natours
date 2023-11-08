const catchAsync = require("../utils/catchAsync");
const AppError = require('../utils/appError')
const APIFeatures = require('../utils/apiFeatures')


exports.deleteOne = Model => catchAsync(async(req,resp,next)=>{
const doc = await Model.findByIdAndDelete(req.params.id)

if (!doc) {
  return next (new AppError('No doc found of given ID'))
}

resp.status(204).json({
  status:'success',
  data:null
})
})



exports.updateOne = Model=>catchAsync(async (req, resp,next) => {
  const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
    runValidators: true
  })

  if (!Model){
    return next(new AppError('No document found with that ID', 404))
  }

  resp.status(200).json({
    status: 'success',
    data: {
      data:doc
    }
  })
})


exports.createOne = Model=>catchAsync(async (req, resp,next) => {
  const doc = await Model.create(req.body)
    resp.status(201).json({
      status: 'success',
      data: {
        doc
      }
    })
  })


exports.getOne = (Model,popOptions)=> catchAsync(async (req, resp,next) => {
  let query = Model.findById(req.params.id);
  if(popOptions) query= query.populate(popOptions);
  const doc = await query  
  
  // const doc = await Model.findById(req.params.id).populate('reviews')
  // // Tour.findOne({_id: req.params.id}) --- findById backend

  if (!doc){
    return next(new AppError('No document found with that ID', 404))
  }
  resp.status(200).json({
    status: 'success',
    data: {
      data:doc
    }
    })
  })



  exports.getAll = Model => catchAsync(async (req, resp,next) => {

//To allow for neted GET review on tour
let filter ={}
  if(req.params.tourId) filter = {tour:req.params.tourId}

 
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate()
    const doc = await features.query

    resp.status(200).json({
      status: 'success',
      requestedAt: req.requestDate,
      results: doc.length,
      data: {
        data:doc
      }
    })
})
