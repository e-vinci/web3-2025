import { Router } from 'express';
import * as userController from './userController';
import * as userStatsController from './userStatsController';

const router = Router();
router.get('/', userController.listUsers);
router.get('/:id/stats', userStatsController.getUserStats);

export default router;
