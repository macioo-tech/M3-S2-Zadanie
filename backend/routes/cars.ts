import express from 'express';

const router = express.Router();

router.get( '/', getCars );
router.get( '/:id', getCarById )
router.post( '/', )
router.post( '/:id/buy', )
router.put( '/:id', )
router.delete( '/:id', )

export default router;