const express = require('express');
const router = express.Router({ mergeParams: true });

const Campground = require('../models/campground.js');
const Review = require('../models/reviews');
const reviews = require('../controllers/reviews');

// const { reviewSchema } = require('../validationSchema.js');

const { validateReview, isLoggedIn, isReviewAuthor } = require('../middleware');

const ExpressError = require('../utils/ExpressError');
const catchAsync = require('../utils/catchAsync');

// const validateReview = (req, res, next) => {
//     const { error } = reviewSchema.validate(req.body);
//     if (error) {
//         const msg = error.details.map(el => el.message).join(',')
//         throw new ExpressError(msg, 400)
//     } else {
//         next();
//     }
// }



router.post('/', isLoggedIn, validateReview, catchAsync(reviews.createReview))

router.delete('/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(reviews.deleteReview))

module.exports = router;