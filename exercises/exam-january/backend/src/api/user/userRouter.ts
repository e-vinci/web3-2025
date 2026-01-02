import { Router } from 'express';
import * as userController from './userController';

const router = Router();
router.get('/', userController.listUsers);

export default router;
