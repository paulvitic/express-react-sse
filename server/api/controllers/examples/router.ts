import express from 'express';
import controller from './controller'
/*export default express.Router()
    .post('/', controller.create)
    .get('/', controller.all)
    .get('/:id', controller.byId);*/

const router = express.Router();

// a middleware function with no mount path. This code is executed for every request to the router
router.use(function (req, res, next) {
    console.log('Time:', Date.now());
    next()
});

router
    .post('/', controller.create)
    .get('/', controller.all)
    .get('/:id', controller.byId);

export default router;
