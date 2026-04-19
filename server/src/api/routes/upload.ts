/**
 * 图片上传接口
 * POST /upload/images - 上传图片（支持多张）
 */
import Router from 'koa-router';
import multer from '@koa/multer';
import path from 'path';
import fs from 'fs';

const router = new Router({ prefix: '/upload' });

// 确保上传目录存在
const uploadDir = path.resolve(__dirname, '../../data/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// multer 配置
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const name = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 jpg/png/gif/webp 格式'));
    }
  },
});

// POST /upload/images
router.post('/images', upload.array('images', 9), async (ctx) => {
  const files = (ctx as any).files as multer.File[];
  if (!files || files.length === 0) {
    ctx.status = 400;
    ctx.body = { code: 400, message: '请选择图片' };
    return;
  }

  const urls = files.map(f => `/uploads/${f.filename}`);
  ctx.body = {
    code: 0,
    message: '上传成功',
    data: { urls },
  };
});

export default router;
