const express = require('express');
const router = express.Router();
const { PrismaClient } = require('../generated/prisma/client');
const prisma = new PrismaClient();

router.post('/add', async (req, res) => {
  const { user, amount } = req.body;
  const topup = await prisma.topUp.create({ data: { user, amount, date: new Date() } });
  res.json(topup);
});

router.get('/list', async (req, res) => {
  const topups = await prisma.topUp.findMany();
  res.json(topups);
});

module.exports = router;
