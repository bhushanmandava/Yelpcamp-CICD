const express = require('express');
const router = express.Router();
const campgrounds = require('../controllers/campground');

const catchAsync = require('../utils/catchAsync');
// const { campgroundSchema } = require('../validationSchema');
const { isLoggedIn, isAuthor, validateCampground } = require('../middleware');

const ExpressError = require('../utils/ExpressError');
const Campground = require('../models/campground');
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });
// const validateCampground = (req, res, next) => {
//     const { error } = campgroundSchema.validate(req.body);
//     if (error) {
//         const msg = error.details.map(el => el.message).join(',')
//         throw new ExpressError(msg, 400)
//     } else {
//         next();
//     }
// }
router.route('/')
    .get(catchAsync(campgrounds.index))
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCampground))
    //.get()

router.get('/new', isLoggedIn, campgrounds.renderNewForm)

router.route('/:id')
    .get(catchAsync(campgrounds.showCampground))
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(campgrounds.updateCampground))
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm))



module.exports = router;