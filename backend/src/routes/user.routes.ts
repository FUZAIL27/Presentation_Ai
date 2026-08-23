import { Router } from 'express';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uploadImage } from '../middleware/upload';
import { updateProfileSchema, changePasswordSchema } from '../validators/auth.validator';
import { updateProfile, uploadAvatar, changePassword, deleteAccount } from '../controllers/user.controller';

const router = Router();

router.use(protect);
router.patch('/me', validate(updateProfileSchema), updateProfile);
router.post('/me/avatar', uploadImage.single('avatar'), uploadAvatar);
router.post('/me/change-password', validate(changePasswordSchema), changePassword);
router.delete('/me', deleteAccount);

export default router;
