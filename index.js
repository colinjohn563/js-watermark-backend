const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();
const upload = multer({ dest: 'temp_videos/' });
const watermarkUpload = multer({ dest: 'temp_watermarks/' });
const port = 3000;

app.use(cors());
app.use(express.static('watermarked_videos'));

const requestTimeout = 360000;

app.use((req, res, next) => {
  req.setTimeout(requestTimeout, () => {
    const error = new Error('Request Timeout');
    error.status = 408;
    next(error);
  });
  next();
});

app.post('/add_watermark', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file provided');
    }

    const uploadedFilePath = req.file.path;
    const watermarkImagePath = 'watermark.png';
    const watermarkScaledPath = 'watermark_scaled.png';
    const watermarkedFilePath = `watermarked_videos/${req.file.originalname.replace(/\.[^/.]+$/, '')}_watermarked.mp4`;

    fs.unlink(watermarkedFilePath, (err) => {
        if (err && err.code !== 'ENOENT') {
            console.error('Error deleting old watermarked video:', err);
        }

        const ffprobePath = 'ffprobe';
        const ffprobeProcess = spawn(ffprobePath, [
            '-v',
            'error',
            '-select_streams',
            'v:0',
            '-show_entries',
            'stream=height',
            '-of',
            'csv=s=x:p=0',
            uploadedFilePath,
        ]);

        ffprobeProcess.stdout.on('data', (data) => {
            const videoHeight = parseInt(data.toString().trim());

            const watermarkScale = Math.floor(videoHeight * 0.1);

            const ffmpegPath = 'ffmpeg';
            const ffmpegScaleProcess = spawn(ffmpegPath, [
                '-i', watermarkImagePath,
                '-vf', `scale=-1:${watermarkScale}`,
                watermarkScaledPath,
            ]);

            ffmpegScaleProcess.on('exit', (code) => {
                if (code === 0) {
                    const ffmpegProcess = spawn(ffmpegPath, [
                        '-i', uploadedFilePath,
                        '-i', watermarkScaledPath,
                        '-filter_complex', `[0:v][1:v]overlay=W-w-10:10:enable='between(t,0,1000000)'`,
                        '-codec:a', 'copy',
                        watermarkedFilePath,
                    ]);

                    ffmpegProcess.on('exit', (code) => {
                        if (code === 0) {
                            res.download(watermarkedFilePath, (err) => {
                                if (err) {
                                    console.error('Error sending watermarked video:', err);
                                }

                                fs.unlink(uploadedFilePath, (err) => {
                                    if (err) {
                                        console.error('Error deleting uploaded file:', err);
                                    }
                                });

                                fs.unlink(watermarkedFilePath, (err) => {
                                    if (err && err.code !== 'ENOENT') {
                                        console.error('Error deleting old watermarked video:', err);
                                    }
                                });
                            });
                        } else {
                            console.error('Failed to add watermark to video. ffmpeg process exited with code:', code);
                            res.status(500).send('Failed to add watermark to video. Please try again.');
                        }

                        fs.unlink(watermarkScaledPath, (err) => {
                            if (err) {
                                console.error('Error deleting scaled watermark image:', err);
                            }
                        });
                    });
                } else {
                    console.error('Failed to scale the watermark image. ffmpeg process exited with code:', code);
                    res.status(500).send('Failed to add watermark to video. Please try again.');
                }
            });
        });

        ffprobeProcess.on('exit', (code) => {
            if (code !== 0) {
                console.error('Failed to get video dimensions. ffprobe process exited with code:', code);
                res.status(500).send('Failed to add watermark to video. Please try again.');
            }
        });
    });
});

app.post('/add_watermark_crewdog', upload.single('file'), watermarkUpload.single('watermark'), (req, res) => {
    if (!req.file || !req.file.path || !req.file.originalname || !req.file.mimetype) {
        return res.status(400).send('No video file provided');
    }

    if (!req.file || !req.file.path || !req.file.originalname || !req.file.mimetype) {
        return res.status(400).send('No watermark image file provided');
    }

    const uploadedFilePath = req.file.path;
    const watermarkImagePath = 'crewdog-watermark.png';
    const watermarkScaledPath = 'watermark_scaled.png';
    const watermarkedFilePath = `watermarked_videos/${req.file.originalname.replace(/\.[^/.]+$/, '')}_watermarked.mp4`;

    fs.unlink(watermarkedFilePath, (err) => {
        if (err && err.code !== 'ENOENT') {
            console.error('Error deleting old watermarked video:', err);
        }

        const ffprobePath = 'ffprobe';
        const ffprobeProcess = spawn(ffprobePath, [
            '-v',
            'error',
            '-select_streams',
            'v:0',
            '-show_entries',
            'stream=height',
            '-of',
            'csv=s=x:p=0',
            uploadedFilePath,
        ]);

        ffprobeProcess.stdout.on('data', (data) => {
            const videoHeight = parseInt(data.toString().trim());

            const watermarkScale = Math.floor(videoHeight * 0.1);

            const ffmpegPath = 'ffmpeg';
            const ffmpegScaleProcess = spawn(ffmpegPath, [
                '-i', watermarkImagePath,
                '-vf', `scale=-1:${watermarkScale}`,
                watermarkScaledPath,
            ]);

            ffmpegScaleProcess.on('exit', (code) => {
                if (code === 0) {
                    const ffmpegProcess = spawn(ffmpegPath, [
                        '-i', uploadedFilePath,
                        '-i', watermarkScaledPath,
                        '-filter_complex', `[0:v][1:v]overlay=W-w-10:10:enable='between(t,0,1000000)'`,
                        '-codec:a', 'copy',
                        watermarkedFilePath,
                    ]);

                    ffmpegProcess.on('exit', (code) => {
                        if (code === 0) {
                            res.download(watermarkedFilePath, (err) => {
                                if (err) {
                                    console.error('Error sending watermarked video:', err);
                                }

                                fs.unlink(uploadedFilePath, (err) => {
                                    if (err) {
                                        console.error('Error deleting uploaded file:', err);
                                    }
                                });

                                fs.unlink(watermarkedFilePath, (err) => {
                                    if (err && err.code !== 'ENOENT') {
                                        console.error('Error deleting old watermarked video:', err);
                                    }
                                });
                            });
                        } else {
                            console.error('Failed to add watermark to video. ffmpeg process exited with code:', code);
                            res.status(500).send('Failed to add watermark to video. Please try again.');
                        }

                        fs.unlink(watermarkScaledPath, (err) => {
                            if (err) {
                                console.error('Error deleting scaled watermark image:', err);
                            }
                        });
                    });
                } else {
                    console.error('Failed to scale the watermark image. ffmpeg process exited with code:', code);
                    res.status(500).send('Failed to add watermark to video. Please try again.');
                }
            });
        });

        ffprobeProcess.on('exit', (code) => {
            if (code !== 0) {
                console.error('Failed to get video dimensions. ffprobe process exited with code:', code);
                res.status(500).send('Failed to add watermark to video. Please try again.');
            }
        });
    });
});

app.listen(port, () => {
  console.log(`API listening at http://localhost:${port}`);
});
