
import { Router } from 'express';
import { login, logout, register, googleAuth } from '../controller/userController.js';

const router=Router();
router.post('/register', register);
router.post('/login',login);
router.post('/logout',logout);
router.post('/google', googleAuth);

export default router;