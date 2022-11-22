const express = require('express');
const tourController = require('./../Controllers/tourController');
const authController = require('./../Controllers/authController');

const reviewRouter = require('./ReviewRoutes');


const router = express.Router();

router.use('/:tourId/reviews',reviewRouter)

// router.param('id',tourController.checkID)

router.route('/top-5-cheap').get(tourController.aliasTopTours,tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(authController.protect,
    authController.restrictTo('admin','lead-guide'),tourController.getMonthlyPlan);


router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin); 

router.route('/distance/:latlng/unit/:unit').get(tourController.getDistances);

router.route('/')
.get(tourController.getAllTours)
.post(authController.protect,
    authController.restrictTo('admin','lead-guide'),
     tourController.CreateTour);



router.route('/:id')
.get(tourController.getTour)
.patch(authController.protect,
    authController.restrictTo('admin','Lead-guide'),
    tourController.updateTourImages,
    tourController.resizeTourImages,
    tourController.updateTour)
.delete(authController.protect,
    authController.restrictTo('admin','Lead-guide'),
    tourController.deleteTour);

//  router.route('/:tourId/reviews')
//     .post(authController.protect,
//      authController.restrictTo('user'),
//      reviewController.createReview);


module.exports=router;