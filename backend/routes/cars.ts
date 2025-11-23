import express from 'express';
import {
  getCars,
  getCarById,
  registerCar,
  buyCar,
  deleteCar
} from '../controllers/cars.controller.js';

const router = express.Router();

router.get( '/', getCars );
router.get( '/:id', getCarById )
router.post( '/', registerCar )
router.post( '/:id/buy', buyCar )
router.delete( '/:id', deleteCar )

export default router;