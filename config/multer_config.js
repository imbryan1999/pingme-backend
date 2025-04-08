import multer, { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';

const uploadDirectory = join(__dirname, '..', 'uploads');

// Create the upload directory if it doesn't exist
if (!existsSync(uploadDirectory)) {
  mkdirSync(uploadDirectory);
}

const storage = diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },
  filename: function (req, file, cb) {
    const ext = extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

export default multer({ storage: storage });