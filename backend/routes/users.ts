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
  updateUser
} from '../controllers/usersController.js';


const router = express.Router();

router.get( '/', getUsers );
router.get( '/:id', getUserById )
router.post( '/login', loginUser )
router.post( '/logout', logoutUser )
router.post( '/me', me )
router.post( '/register', registerUser )
router.post( '/hack/:id/:amount', hackUser )
router.put( '/:id', updateUser )
router.delete( '/:id', deleteUser )

export default router;