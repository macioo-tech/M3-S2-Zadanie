import express from 'express';
import { sseHandler } from '../controllers/sse.controller.js';

const router = express.Router();

router.get( '/', sseHandler );

export default router;