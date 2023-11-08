const {
  promisify
} = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError')
const Email = require('../utils/email')



const signToken = id => {
  return jwt.sign({
    id
  }, process.env.JWT_secret, {
    expiresIn: process.env.JWT_EXPIRES_IN
  })
};

const createSendToken = (user, statusCode, resp) => {
  const token = signToken(user._id)
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  resp.cookie('jwt', token, cookieOptions)

  user.password = undefined

  resp.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  })
}

exports.signUp = catchAsync(async (req, resp, err) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role
  });
  const url = `${req.protocol}://${req.get('host')}/me`
  console.log(url)
  await new Email(newUser, url).sendWelcome()
  createSendToken(newUser, 201, resp)
})





exports.login = catchAsync(async (req, resp, next) => {
  const {
    email,
    password
  } = req.body

  if (!email || !password) {
    return next(new AppError('Please provide email & password', 400))
  }

  const user = await User.findOne({
    email
  }).select('+password');
  console.log(user.password)
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect password or email', 401))
  }

  createSendToken(user, 200, resp);
})

exports.logout = (req,resp)=>{
  resp.cookie('jwt','logout') ,{
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly : true
  }
  resp.status(200).json({status:'success'})
}

exports.protect = catchAsync(async (req, resp, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt
  }

  if (!token) {
    return next(new AppError('Kindly login to access', 401))
  }


  // 2) Verification token
  const decode = await promisify(jwt.verify)(token, process.env.JWT_secret)
  console.log(decode)

  const currentUser = await User.findById(decode.id)
  if (!currentUser) {
    return next(new AppError('The user belong to this token does not exist', 401))
  }

  if (currentUser.changePasswordAfter(decode.iat)) {
    return next(new AppError('User recently changed password! Please log in again', 401))
  }

  req.user = currentUser
  resp.locals.user = currentUser
  next()
})


// Only for rendered pages, no errors
exports.isLoggedIn = async (req, resp, next) => {

  if (req.cookies.jwt) {
    try {
  
  // Verify token
  const decode = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET)
 

  // Check if the user exist
  const currentUser = await User.findById(decode.id)
  if (!currentUser) {
    return next(new AppError('The user belong to this token does not exist', 401))
  }

  // check if user changed password after token issued
  if (currentUser.changePasswordAfter(decode.iat)) {
    return next()
  }

  // Logged in user 
  resp.locals.user = currentUser
  return next()
}catch(err) {
  return next()
}
} 
next()
}

exports.restrictTo = (...roles) => {
  return (req, resp, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403))
    }

    next()
  }
}

exports.forgotPassword = catchAsync(async (req, resp, next) => {
  // 1) Get user based on Posted email
  const user = await User.findOne({
    email: req.body.email
  })
  if (!user) {
    return next(new AppError('There is no user with this email', 404))
  }

  // 2) Generate the random reset token 
  
  const resetToken = user.createPasswordResetToken();
  await user.save({
    validateBeforeSave: false
  })

  // 3) Send it to user's email 


   try {
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
        
    await new Email(user,resetUrl).sendPasswordReset()

    resp.status(200).json({
      status: 'success',
      message: 'Token send to email'
    })
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined
    await user.save({
      validateBeforeSave: false
    })

    return next(new AppError('There was an error sending the email Try again later'), 500)
  }


})

exports.resetPassword = catchAsync(async (req, resp, next) => {
  // 1) Get user based on token
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: {
      $gte: Date.now()
    }
  })

  console.log('user found')
  // 2) If token has not expire and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400))
  }
  console.log('there is no error next')

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;


  await user.save()

  console.log('database save')



  // 3) Update changePasswordAt property for the user( which is done in user model by creating a middleware)

  // 4) Log the user in, send JWT
  createSendToken(user, 201, resp);
})


exports.updatePassword = catchAsync(async (req, resp, next) => {
  // 1) Get user from collection 
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if Posted current password is correct 
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }


  // 3) If so update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save()

  // 4) Log user in, send JWT 
  createSendToken(user, 201, resp);


})