import { Router } from 'express';
import * as transactionController from './transactionController';

const router = Router();
router.get('/', transactionController.listTransactions);

export default router;
