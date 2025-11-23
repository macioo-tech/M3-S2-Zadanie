import express from 'express';
import { getUserById, getUsers, loginUser } from '../controllers/usersController.js';

const router = express.Router();

router.get( '/', getUsers );
router.get( '/:id', getUserById )
router.post( '/login', loginUser )
router.post( '/logout', )
router.post( '/me', )
router.post( '/register', )
router.put( '/:id', )
router.delete( '/:id', )

export default router;