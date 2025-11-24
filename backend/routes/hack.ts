import express from 'express';
import { hackUser } from '../controllers/users.controller.js';

const router = express.Router();

router.post( '/:id/:amount', hackUser )

export default router;