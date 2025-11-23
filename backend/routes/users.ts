import express from 'express';
import {
  deleteUser,
  getUserById,
  getUsers,
  hackUser,
  loginUser,
  logoutUser,
  me,
  registerUser,
  putUser
} from '../controllers/users.controller.js';

const router = express.Router();

router.get( '/', getUsers );
router.get( '/:id', getUserById )
router.post( '/login', loginUser )
router.post( '/logout', logoutUser )
router.post( '/me', me )
router.post( '/register', registerUser )
router.post( '/hack/:id/:amount', hackUser )
router.put( '/:id', putUser )
router.delete( '/:id', deleteUser )

export default router;