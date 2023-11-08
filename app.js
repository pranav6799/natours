const path = require('path')
const express = require('express');
const pug = require('pug')
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean')
const hpp = require('hpp')
const cookieParser = require('cookie-parser')


const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')

const tourRouter = require(`./routes/tourRoutes`)
const userRouter = require(`./routes/userRoutes`)
const reviewRouter = require('./routes/reviewRoutes')
const viewRouter = require('./routes/viewRoutes')
const bookingRouter = require('./routes/bookingsRoutes')

// Start express app
const app = express();

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

// 1.GLOBAL MIDDLEWARES 
app.use(express.static(path.join(__dirname, 'public')))

// Security HTTP Header
// app.use(helmet())

// Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

//Limit request from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP please try again later within an hour'
})
app.use('/api', limiter)

// Body Parser, reading data from the body into req.body
app.use(express.json({
  limit: '10kb'
}));
app.use(express.urlencoded({
extended:true, limit:'10kb'
}))
app.use(cookieParser())

// Data sanitization against NoSql query injection 
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss())

// Prevent Parameter Pollution
app.use(hpp())

// Serving static files

//Test Middleware
app.use((req, resp, next) => {
  console.log('Hi this is middleware')
  next();
})


// Test Middleware
app.use((req, resp, next) => {
  req.requestDate = new Date().toDateString()
  next()
})



// Routes

app.use('/', viewRouter)
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)
app.use('/api/v1/bookings', bookingRouter)

app.all('*', (req, resp, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(err);

  // next( new AppError(`Can't find ${req.originalUrl} on this server!`,404));
});

app.use(globalErrorHandler);

module.exports = app