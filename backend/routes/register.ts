import express from 'express';
import { registerUser } from '../controllers/users.controller.js';

const router = express.Router();

router.post( '/', registerUser )

export default router;