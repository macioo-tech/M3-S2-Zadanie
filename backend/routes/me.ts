import express from 'express';
import { me } from '../controllers/users.controller.js';

const router = express.Router();

router.post( '/', me );

export default router;