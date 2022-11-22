const Tour = require('./../models/tourModel');
// const APIFeatures = require('./../utils/apiFeatures')
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerfactory');
const multer = require('multer');
const sharp = require('sharp');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.updateTourImages = upload.fields([
  {name:'imageCover',maxCount:1},
{name:'images',maxCount: 3}
]);

// upload.single('image')
// upload.array('images',5)

exports.resizeTourImages =catchAsync(async(req,res,next)=>{

  if(!req.files.imageCover || !req.files.images) return next();

  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`
  await sharp(req.file.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  req.body.images = [];  

 await Promise.all( req.files.images.map( async(file,i) => {
    const filename = `tour-${req.params.id}-${Date.now()}-${i+1}.jpeg`;


    await sharp(req.file.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${filename}`);


    req.body.images.push(filename)

  })
 );

  next();
});

exports.aliasTopTours=  (req,res,next)=>{

        req.query.limit='5';
        req.query.sort ='-ratingsAverage,price';
        req.query.fields= 'name,price,ratingsAverage,summary,difficulty';
        next();
}




// exports.getAllTours= catchAsync(async (req,res)=>{


//     // console.log(req.query);
//     // const queryDB = {...req.query};
//     // const excludeFields = ['page','sort','limit','fields'];
//     // excludeFields.forEach(el=>delete queryDB[el]);


//     // let queryStr = JSON.stringify(queryDB);
//     // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g,match =>`$${match}`);
    
//     // let query = Tour.find(JSON.parse(queryStr));

//     // if(req.query.sort)
//     // {
//     //     const sortBy = req.query.sort.split(',').join(' ');
//     //     query = query.sort(sortBy);
//     // }else{
//     //     query = query.sort('-createAt')
//     // }

//     // if(req.query.fields)
//     // {
//     //     const fields = req.query.fields.split(',').join(' ');
//     //     query = query.select(fields);
//     // }else{
//     //     query = query.select('__v');
//     // }

//     // const page = req.query.page*1 || 1;
//     // const limit = req.query.limit*1 || 100;
//     // const skip = (page-1)*limit;


//     // query = query.skip(skip).limit(limit);

//     //  if(req.query.page)
//     //  {
//     //     const numTours = await Tour.countDocuments();
//     //     if(skip >= numTours) throw new Error('This page does no exists');
//     //  }

//     const features = new APIFeatures(Tour.find(),req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();

//     const tours = await features.query;


//     res.status(200).json({
//         status:'success',
//         result:tours.length,
//         data:{
//             tours
//         }
//     });


// });
exports.getAllTours = factory.getAll(Tour);
exports.getTour= factory.getOne(Tour,{path: 'reviews'});
exports.CreateTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = catchAsync(async(req,res)=>{

//          const tour = await Tour.findByIdAndDelete(req.params.id);
         
//          if(!tour)
//           {
//             return next(new AppError('No tour found with that ID',404));
//            }

//          res.status(200).json({
//             status:'success',
//             data:{
//                 tour
//             }
//          })

// });


exports.getTourStats = catchAsync(async (req, res) => {

      const stats = await Tour.aggregate([
        {
          $match: { ratingAverage: { $gte: 4.5 } }
        },
        {
          $group: {
            _id: { $toUpper: '$difficulty' },
            numTours: { $sum: 1 },
            numRatings: { $sum: '$ratingsQuantity' },
            avgRating: { $avg: '$ratingAverage' },
            avgPrice: { $avg: '$price' },
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' }
          }
        },
        {
          $sort: { avgPrice: 1 }
        }
        // {
        //   $match: { _id: { $ne: 'EASY' } }
        // }
      ]);
  
      res.status(200).json({
        status: 'success',
        data: {
          stats
        }
      });

  });


  exports.getMonthlyPlan =catchAsync(async (req,res) =>
  {
    

        const year = req.params.year *1 ;

        const plan = await Tour.aggregate([
            {
                $unwind: '$startDates'
            },
            {
                $match:{
                    startDates:{
                        $gte: new Date(`${year}-01-01`),
                        $lte:new Date(`${year}-12-31`)
                    }
                }
            },
            {
                $group:{
                    _id:{ $month : '$startDates'},
                    numTourStarts:{$sum:1 },
                    tours: { $push: '$name'}
                }
            },

            {
                 $addFields: {month: '$_id'}
            },
            {
                $project:{
                    _id:0
                }
            },
            {
                $sort:{ numTourStarts : -1}
            },
            {
                $limit:6
            }
        ])

        res.status(200).json({
            status: 'success',
            data: {
              plan
            }
          });

    
  });
  
  exports.getToursWithin = catchAsync(async (req,res,next)=>{
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
  
   const radius =  unit === 'mi'? distance/3963.2: distance/6378.1;
    if(!lat || !lng)
    {
       next(new AppError('Please provide latitude and longitude in the format lat,lng',400));
    }

    const tours = await Tour.find({startLocation: {$geoWithin:{ $centerSphere: [[lng,lat],radius]}}});

    res.status(200).json({
      status:"success",
      result: tours.length,
      data:{
        data:tours
      }

    })


  });

  exports.getDistances = catchAsync(async (req,res,next)=>{
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
    
    if(!lat || !lng)
    {
       next(new AppError('Please provide latitude and longitude in the format lat,lng',400));
    }
   
    const multiplier = unit === 'mi' ? 0.000611371 :0.001;
   const distances = await Tour.aggregate([
    {
      $geoNear: {
        near:{
          type:'Point',
          coordinates :[lng*1,lat*1]
        },
        distanceField : 'distance',
        distanceMultiplier:multiplier
      }
    },{
      $project:{
        distance:1,
        name: 1
      }
    }
   ]);

   res.status(200).json({
    status:"success",
    data:{
      data:distances
    }

  })


  })
