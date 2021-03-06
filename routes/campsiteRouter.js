const express = require('express');
const Campsite = require('../models/campsite');
const authenticate = require('../authenticate');
const campsiteRouter = express.Router();
const cors = require('./cors'); // import cors module from route folder

// Chain all methods to the campsite router
campsiteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))   // handle a preflight request
.get(cors.cors, (req, res, next) => {
    Campsite.find()
    .populate('comments.author')    // when the campsites docs are retrieved, poulate the author field of the 
                                    // comments subdocument by finding the user document that matches the obj id that's stored there
    .then(campsites => {
        res.json(campsites);
    })
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.create(req.body)
    .then(campsite => {
        console.log('Campsite Created ', campsite);
        res.json(campsite);
    })
    .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.status(403).end('PUT operation not supported on /campsites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.deleteMany()
    .then(response => {
        res.json(response);
    })
    .catch(err => next(err));
});

// Add routing for individual campsites
campsiteRouter.route('/:campsiteId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
    .populate('comments.author')
    .then(campsite => {
        res.json(campsite);
    })
    .catch(err => next(err));
})
.post(cors.cors, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.status(403).end(`POST operation not supported on /campsites/${req.params.campsiteId}`);
})
.put(cors.cors, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.findByIdAndUpdate(req.params.campsiteId, {
        $set: req.body
    }, { new: true })
    .then(campsite => {
        res.json(campsite);
    })
    .catch(err => next(err));
})
.delete(cors.cors, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.findByIdAndDelete(req.params.campsiteId)
    .then(response => {
        res.json(response);
    })
    .catch(err => next(err));
});

//====
campsiteRouter.route('/:campsiteId/comments')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
    .populate('comments.author')
    .then(campsite => {
        if (campsite) {
            res.json(campsite.comments);
        } else {
            err = new Error(`Campsite ${req.params.campsiteId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
})
.post(cors.cors, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
    .then(campsite => {
        if (campsite) {
            req.body.author = req.user._id; // save user._id to author field before comment in body gets pushed to array
            campsite.comments.push(req.body);
            campsite.save()
            .then(campsite => {
                res.json(campsite);
            })
            .catch(err => next(err));
        } else {
            err = new Error(`Campsite ${req.params.campsiteId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
})
.put(cors.cors, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.status(403).end(`PUT operation not supported on /campsites/${req.params.campsiteId}/comments`);
})
.delete(cors.cors, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
    .then(campsite => {
        if (campsite) {
            for (let i = (campsite.comments.length-1); i >= 0; i--) {
                campsite.comments.id(campsite.comments[i]._id).remove();
            }
            campsite.save()
            .then(campsite => {
                res.json(campsite);
            })
            .catch(err => next(err));
        } else {
            err = new Error(`Campsite ${req.params.campsiteId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
});

//===
campsiteRouter.route('/:campsiteId/comments/:commentId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
    .populate('comments.author')
    .then(campsite => {
        if (campsite && campsite.comments.id(req.params.commentId)) {
            res.json(campsite.comments.id(req.params.commentId));
        } else if (!campsite) {
            err = new Error(`Campsite ${req.params.campsiteId} not found`);
            err.status = 404;
            return next(err);
        } else {
            err = new Error(`Comment ${req.params.commentId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
})
.post(cors.cors, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.status(403).end(`POST operation not supported on /campsites/${req.params.campsiteId}/comments/${req.params.commentId}`);
})
.put(cors.cors, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
    .then(campsite => {
        let commentId = campsite.comments.id(req.params.commentId);
        if (req.user._id.equals(commentId.author._id)) {
            if (campsite && commentId) {
                if (req.body.rating) {
                    commentId.rating = req.body.rating;
                }
                if (req.body.text) {
                    commentId.text = req.body.text;
                }
                campsite.save()
                .then(campsite => {
                    res.json(campsite);
                })
                .catch(err => next(err));
            } else if (!campsite) {
                err = new Error(`Campsite ${req.params.campsiteId} not found`);
                err.status = 404;
                return next(err);
            } else {
                err = new Error(`Comment ${req.params.commentId} not found`);
                err.status = 404;
                return next(err);
            }
        } else {
            err = new Error(`Unauthorized. You are not the author of this comment!`);
            err.status = 403;
            return next(err);
        }
    })
    .catch(err => next(err));
})
.delete(cors.cors, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
    .then(campsite => {
        let commentId = campsite.comments.id(req.params.commentId);
        if (req.user._id.equals(commentId.author._id)) {
            if (campsite && commentId) {
                commentId.remove();
                campsite.save()
                .then(campsite => {
                    res.json(campsite);
                })
                .catch(err => next(err));
            } else if (!campsite) {
                err = new Error(`Campsite ${req.params.campsiteId} not found`);
                err.status = 404;
                return next(err);
            } else {
                err = new Error(`Comment ${req.params.commentId} not found`);
                err.status = 404;
                return next(err);
            }
        } else {
            err = new Error(`Unauthorized. You are not the author of this comment!`);
            err.status = 403;
            return next(err);
        }
    })
    .catch(err => next(err));
});

module.exports = campsiteRouter;