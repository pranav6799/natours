const AppError = require('../utils/appError')

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`
  return new AppError(message,400)
}

const handleDuplicateFieldsDB =err => {
  // const value = err.message.match(/(["'])(\\?.)*?\1/)[0]
  const message = `Duplicate field value: x. Please use another value`
  return new AppError(message,400)
}

const handleValidatorErrorDB = err=>{
  const errors = Object.values(err.errors).map(el=> el.message)
  const message = (`Invalid ${errors.join('. ')}`);
  return new AppError(message,400)
}

const handleJwtError = err => new AppError('Invalid Token please log in again',401)  

const handleJwtExpiredError = err => new AppError('Your token has expired please login again',401)


const sendErrorDev = (err,req,resp) => {
  console.log(req)

  //API
  if(req.originalUrl.startsWith('/api')) {
  return resp.status(err.statusCode).json({
    status : err.status,
    message : err.message,
    error : err,
    stack : err.stack
  });
  
} 
// Rendered Website

 return resp.status(err.statusCode).render('error',{
    title:'Something went wrong',
    msg: err.message
  })
}







const sendErrorProd = (err,req,resp)=>{
  //API
if(req.originalUrl.startsWith('/api')) {
//Operational trusted error: send message to client 
if (err.isOperational){
  return resp.status(err.statusCode).json({
   status : err.status,
   message : err.message
  });
} 

// Programming or any unknown error : don't leak error details to client 

  // console.log('ERROR',err)
 
  
  return resp.status(500).json({
    status : 'error',
    message : 'Something went wrong'
  }) 

}

  //Rendered website
  if (err.isOperational){
    return resp.status(err.statusCode).render('error',{
      title:'Something went wrong',
      msg: err.message
    })
  } 
  
  // Programming or any unknown error : don't leak error details to client 
  
    // console.log('ERROR',err)
   return resp.status(err.statusCode).render('error',{
    title:'Something went wrong',
    msg: 'Please try again later'
  })
}




module.exports = (err, req, resp, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err,req, resp);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = error.message

    // Check for specific error conditions
    if (error.message === 'Cast to ObjectId failed for value')
      error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidatorErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJwtError(error);
    if (error.name === 'TokenExpiredError') error = handleJwtExpiredError(error)

    sendErrorProd(error, resp);
  }

  // Add this line to pass unhandled errors to Express's error handling middleware

};






























































// module.exports = (err,req,resp,next)=>{
//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || 'error';

//    if(process.env.NODE_ENV==='development'){
//    sendErrorDev(err,resp)
//    }else if (process.env.NODE_ENV==='production'){
//     let error = {...err};

//     // eslint-disable-next-line no-constant-condition
//     if(message ='Cast to ObjectId failed for value') error = handleCastErrorDB(error);
//     if(error.code === 11000) error = handleDuplicateFieldsDB(error);
//     if(error.name === 'ValidationError') error = handleValidatorErrorDB(error)
//     if(error.name === 'JsonWebTokenError') error = handleJwtError(error)



//     sendErrorProd(error,resp) 
// }
// next (err)
// }