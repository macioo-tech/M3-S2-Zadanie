import express from 'express';

const router = express.Router();

router.get( '/', sseHandler );


export default router;