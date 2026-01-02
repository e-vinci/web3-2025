import express from 'express';
import * as commentController from './commentController';

const router = express.Router();

router.get('/', commentController.listComments);
router.get('/:id', commentController.getCommentDetail);
router.get('/expense/:expenseId', commentController.getCommentsByExpense);
router.get('/expense/:expenseId/count', commentController.getCommentCount);
router.post('/', commentController.createComment);
router.put('/:id', commentController.updateComment);
router.delete('/:id', commentController.deleteComment);

export default router;
