const mongoose = require('mongoose')
const { validationResult } = require('express-validator')
const { getCoordsForAddress } = require('../utils/location-utils')
const LoggingUtil = require('../utils/logging-utils')

const HttpError = require('../models/http-error')
const Place = require('../models/place')
const User = require('../models/user')

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid
  console.log(`placeId: ${placeId}`)
  console.log(`[PLACES: /:pid] GET /${placeId}`)
  // Validations
  let place
  try {
    place = await Place.findById(placeId)
  } catch (error) {
    LoggingUtil.getDatabaseInteractMsg('getPlaceById', error)
    return next(new HttpError('Retrieving place unsuccessful. Please try again later', 500))
  }
  if (!place) {
    return next(new HttpError('Could not find a place for the provided pid.', 404))
  }
  // Execute
  res.json({ place: place.toObject({ getters: true }) })
}

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid
  console.log(`[PLACES: /user/:uid] GET /${userId}`)
  // Validation
  let user
  let places = []
  try {
    user = await User.findById(userId).populate('places')
    places = user.places
  } catch (error) {
    LoggingUtil.getDatabaseInteractMsg('getPlacesByUserId', error)
    return next(new HttpError('Retrieving place unsuccessful. Please try again later', 500))
  }
  if (!user || places.length <= 0) {
    return next(new HttpError('Could not find a place for the provided uid.', 404))
  }
  // Execute
  res.json({ places: places.map(place => place.toObject({ getters: true })) })
}

const createPlace = async (req, res, next) => {
  console.log('[PLACES: /] POST /')
  const databaseUnsuccess = new HttpError('Creating place unsuccessful. Please try again later', 500)
  // Validations
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    LoggingUtil.getUserReqMessage('createPlace', errors)
    return res.status(422).json(errors)
  }
  // Declarations
  const { title, description, address, creator } = req.body
  let user
  try {
    user = await User.findById(creator)
  } catch (error) {
    LoggingUtil.getDatabaseInteractMsg('createPlace', error)
    return next(databaseUnsuccess)
  }
  if (!user) {
    return next(new HttpError('Provided Creator ID does not exist', 422))
  }
  const newPlace = new Place({
    title,
    description,
    address,
    location: getCoordsForAddress(),
    image: 'https://external-preview.redd.it/rAu9SdsqxWCmiA3NKT75q_zAz2lvXYPoXp6MTORGe9c.jpg',
    creator
  })
  let result = {}
  // Execute
  try {
    const session = await mongoose.startSession()
    session.startTransaction()
    result = await newPlace.save({ session })
    user.places.push(newPlace)
    await user.save({ session })
    await session.commitTransaction()
  } catch (error) {
    LoggingUtil.getDatabaseInteractMsg('createPlace', error)
    return next(databaseUnsuccess)
  }
  res
    .status(201)
    .json({ place: result.toObject({ getters: true }) })
}

const updatePlace = async (req, res, next) => {
  const placeId = req.params.pid
  console.log(`[PLACES: /:pid] PATCH /${placeId}`)
  // Validations
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    LoggingUtil.getUserReqMessage('updatePlace', errors)
    return res.status(422).json(errors)
  }
  let updatedPlace
  try {
    updatedPlace = await Place.findById(placeId)
  } catch (error) {
    LoggingUtil.getDatabaseInteractMsg('updatePlace', error)
  }
  if (!updatedPlace) {
    return next(new HttpError('Could not find a place for the provided pid.'), 404)
  }
  // Declarations
  const { title, description } = req.body
  let result = null
  // Execute
  updatedPlace.title = title
  updatedPlace.description = description
  try {
    result = await updatedPlace.save()
  } catch (error) {
    LoggingUtil.getDatabaseInteractMsg('updatePlace', error)
    return next(new HttpError('Updating place unsuccessful. Please try again later', 500))
  }
  res
    .status(200)
    .json({ place: result.toObject({ getters: true }) })
}

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid
  console.log(`[PLACES: /:pid] DELETE /${placeId}`)
  // Validations
  let deletedPlace
  try {
    deletedPlace = await Place.findById(placeId).populate('creator')
  } catch (error) {
    LoggingUtil.getDatabaseInteractMsg('deleted', error)
  }
  if (!deletedPlace) {
    return next(new HttpError('Could not find a place for the provided pid.'), 404)
  }
  // Execute
  try {
    const session = await mongoose.startSession()
    session.startTransaction()
    deletedPlace.creator.places.pull(deletedPlace)
    await deletedPlace.creator.save({ session })
    await deletedPlace.remove({ session })
    await session.commitTransaction()
  } catch (error) {
    LoggingUtil.getDatabaseInteractMsg('deleted', error)
    return next(new HttpError('Deleting place unsuccessful. Please try again later', 500))
  }
  res
    .status(200)
    .send()
}

exports.getPlaceById = getPlaceById
exports.getPlacesByUserId = getPlacesByUserId
exports.createPlace = createPlace
exports.updatePlace = updatePlace
exports.deletePlace = deletePlace
