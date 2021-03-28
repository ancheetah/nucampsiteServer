const express = require('express');
const authenticate = require('../authenticate');
const cors = require('./cors');
const Favorite = require('../models/favorite');

const favoriteRouter = express.Router();

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get( authenticate.verifyUser, (req, res, next) => {
    // console.log(req.user);
    Favorite.find({ user: req.user._id })
    .populate('user')
    .populate('campsites')
    .then(favorites => {
        res.json(favorites);
    })
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Favorite.findOne({user: req.user._id })
    .then( favorite => {
        if (favorite){  // favorite document exists
            req.body.forEach( newSite => {
                if (!favorite.campsites.includes(newSite._id)) {
                    favorite.campsites.push(newSite._id);
                }
            })
            favorite.save()
            .then(favorite => {
                res.json(favorite);
            })
            .catch(err => next(err));
        } else {
            Favorite.create({
                user: req.user.id,
                campsites: req.body
            })
            favorite.save()
            .then(favorite => {
                console.log('Favorite Created ', favorite);
                res.json(favorite);
            })
            .catch(err => next(err));
        }
    })
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    // res.status(403).end('PUT operation not supported on /partners');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    // Partner.deleteMany()
    // .then(response => {
    //     res.json(response);
    // })
    // .catch(err => next(err));
});

//===
favoriteRouter.route('/:campsiteId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get((req, res, next) => {
    res.status(200);
    // Favorite.findById(req.params.campsiteId)
    // .then(favorite => {
    //     res.json(favorite);
    // })
    // .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    // res.status(403).end(`POST operation not supported on /partners/${req.params.partnerId}`);
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    // Partner.findByIdAndUpdate(req.params.partnerId, {
    //     $set: req.body
    // }, { new: true })
    // .then(partner => {
    //     res.json(partner);
    // })
    // .catch(err => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    // Partner.findByIdAndDelete(req.params.partnerId)
    // .then(response => {
    //     res.json(response);
    // })
    // .catch(err => next(err));
});

module.exports = favoriteRouter;