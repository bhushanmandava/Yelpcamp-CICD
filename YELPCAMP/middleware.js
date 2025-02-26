const ExpressError = require("./utils/ExpressError");

const { campgroundSchema, reviewSchema } = require('./validationSchema')
const Campground = require('./models/campground');
const Review = require('./models/reviews')




module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();
}

module.exports.validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    console.log(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join('.')
        throw new ExpressError(msg, 400)
    }
    else {
        next()
    }
}
module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground.author.equals(req.user._id)) {
        req.flash('error', 'You donot have permissions')
        return res.redirect(`/campground/${id}`)
    }
    next();
}
module.exports.isReviewAuthor = async (req, res, next) => {
    const { id } = req.params;
    const review = Review.findById(id);
    if (!review.author.equals(req.user._id)) {
        req.flash('error', 'You donot have permissions')
        return res.redirect(`/campground/${id}`)
    }
    next()
}
module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}
module.exports.logout = (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err); // Pass error to Express error handler
      }
      req.flash('success', 'Logged out successfully!');
      res.redirect('/campgrounds'); // Redirect after logout
    });
  };
  