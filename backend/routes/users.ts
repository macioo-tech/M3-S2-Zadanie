import express from 'express';
import {
  deleteUser,
  getUserById,
  getUsers,
  putUser
} from '../controllers/users.controller.js';

const router = express.Router();

router.get( '/', getUsers );
router.get( '/:id', getUserById )
router.put( '/:id', putUser )
router.delete( '/:id', deleteUser )

export default router;