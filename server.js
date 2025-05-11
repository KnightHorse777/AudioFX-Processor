const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.static('public')); // Serve index.html

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Endpoint to convert WAV to MP3
app.post('/convert-to-mp3', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }

  const inputPath = req.file.path;
  const outputPath = path.join('uploads', `processed_audio_${Date.now()}.mp3`);

  ffmpeg(inputPath)
    .audioBitrate(128)
    .toFormat('mp3')
    .on('end', () => {
      res.download(outputPath, 'processed_audio.mp3', (err) => {
        // Clean up files
        try {
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
        } catch (cleanupErr) {
          console.error('Cleanup error:', cleanupErr);
        }
        if (err) {
          console.error('Error sending file:', err);
        }
      });
    })
    .on('error', (err) => {
      console.error('FFmpeg error:', err);
      res.status(500).send('Error converting audio');
      try {
        fs.unlinkSync(inputPath);
      } catch (cleanupErr) {
        console.error('Cleanup error:', cleanupErr);
      }
    })
    .save(outputPath);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Server is running');
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});