const express = require('express')
const router = express.Router()

const placeController = require('../controllers/place-controllers')

router.get('/:pid', placeController.getPlaceById)
router.get('/user/:uid', placeController.getPlacesByUserId)

router.post('/', placeController.createPlace)

router.patch('/:pid', placeController.updatePlace)

router.delete('/:pid', placeController.deletePlace)

module.exports = router
