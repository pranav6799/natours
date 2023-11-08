const fs = require('fs');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel')
const AppError = require('../utils/appError')
const factory = require('./handlerFunction')
const multer = require('multer')
const sharp = require('sharp')

const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

// const multerStorage = multer.diskStorage({
// destination: (req,file,cb)=>{
//   cb(null, 'public/img/users')
// }, 
// filename: (req,file,cb) =>{
//   const ext = file.mimetype.split('/')[1]
//   cb(null,`user-${req.user.id}-${Date.now()}.${ext}`)
// }
// })
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

exports.uploadUserPhoto = upload.single('photo')

exports.resizeUserPhoto = catchAsync(async (req, resp, next) => {
  if (!req.file) return next()

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

 await  sharp(req.file.buffer)
  .resize(500, 500)
  .toFormat('jpeg')
  .jpeg({quality: 90})
  .toFile(`public/img/users/${req.file.filename}`)

  next()

})

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el]
  })
  return newObj
}

exports.getMe = (req, resp, next) => {
  req.params.id = req.user.id
  next()
}

exports.createUsers = (req, resp) => {
  resp.status(500).json({
    status: 'error',
    message: 'This route is not defined and please use sign up instead'
  })
}


exports.updateMe = catchAsync(async (req, resp, next) => {

  // 1) Create error if user post password data   
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password update please use /updateMyPassword', 400))
  }

  // 2) Filtered out unwanted fields that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename

  // 3) Update user document
  const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  resp.status(200).json({
    status: 'success',
    data: {
      user: updateUser
    }
  })

})

exports.deleteMe = catchAsync(async (req, resp, next) => {
  await User.findByIdAndUpdate((req.user.id), {
    active: false
  })


  resp.status(201).json({
    status: 'success',
    data: null
  })

})

exports.getAllUsers = factory.getAll(User)
exports.getUsers = factory.getOne(User)

// Do not update password with this
exports.updateUsers = factory.updateOne(User)
exports.deleteUsers = factory.deleteOne(User)