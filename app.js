const path = require('path');

const express  = require('express');

const morgan = require('morgan');

const helmet = require('helmet');

const mongoSanitize = require('express-mongo-sanitize');

const xss = require('xss-clean');

const hpp = require('hpp');

const cookieParser = require('cookie-parser');

const rateLimit = require('express-rate-limit');

const globalErrorHandler = require('./Controllers/ErrorController') 

const AppError = require('./utils/appError')

const tourRoute = require('./Routes/TourRoutes');

const UserRoute = require('./Routes/UserRoutes');

const ReviewRoute = require('./Routes/ReviewRoutes');
const bookingRoute = require('./Routes/bookingRoutes');
const viewRoute = require('./Routes/viewRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views',path.join(__dirname,'views'));

app.use(helmet());

if(process.env.NODE_ENV=== 'development')
{
    app.use(morgan('dev'));
}

const limiter = rateLimit({
    max:100,
    windowMs:60 * 60 * 1000,
    message: 'Too many request from this IP,please try again in an hour!'
})

app.use('/api',limiter);



app.use(express.json({limit: '10kb'}));

app.use(express.urlencoded({extended: true, limit: '10kb'}))

app.use(cookieParser());


//Date sanitization against Nosql query injection
app.use(mongoSanitize());

app.use(xss());

app.use(hpp({
    whitelist:[  'duration','ratingsQuantity','ratingsAverage','maxGroupSize','difficulty','price' ]
}));


app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname,'public')));
// app.get('/',(req,res)=>{
//     res.status(200).send('hello from server side');
// })


app.use((req,res,next)=>{
    req.requestTime = new Date().toISOString();
    next();
})


// app.get('/api/v1/tours', getAllTours);

// app.get('/api/v1/tours/:id',getTour);

// app.post('/api/v1/tours',CreateTour);

// app.patch('/api/v1/tours/:id',updateTour);

// app.delete('/api/v1/tours/:id',deleteTour);



app.use('/',viewRoute);
app.use('/api/v1/tours',tourRoute);
app.use('/api/v1/users',UserRoute);
app.use('/api/v1/reviews',ReviewRoute);
app.use('/api/v1/bookings',bookingRoute)


app.all('*',(req,res,next)=>{
    
    // const err = new Error(`can't find ${req.originalUrl} on the server`);
    // err.status = 'fail';
    // err.statusCode = 404;

    next(new AppError(`can't find ${req.originalUrl} on the server`,404));
});

app.use(globalErrorHandler);



module.exports=app;
