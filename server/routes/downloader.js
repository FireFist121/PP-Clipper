const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('../../bot/utils/logger');
const { DIRS } = require('../../shared/storage');
const { ytDlp, ffmpeg } = require('../../shared/binaries');

// Create manual download dir if it doesn't exist
const MANUAL_DIR = path.join(DIRS.downloads, 'manual');
if (!fs.existsSync(MANUAL_DIR)) {
    fs.mkdirSync(MANUAL_DIR, { recursive: true });
}


/**
 * POST /api/downloader/download
 */
router.post('/download', async (req, res) => {
    const { url, start, end, format = 'video', quality = '1080' } = req.body;

    if (!url || !start || !end) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const timestamp = Date.now();
        const outputFilename = `segment_${timestamp}.${format === 'audio' ? 'mp3' : 'mp4'}`;
        const outputPath = path.join(MANUAL_DIR, outputFilename);

        const ytDlpPath = ytDlp;
        const ffmpegPath = ffmpeg;

        let args;

        if (format === 'audio') {
            args = [
                '--no-playlist',
                '--no-check-certificates',
                '--ffmpeg-location', ffmpegPath,
                '--extractor-args', 'youtube:player_client=ios;player_skip=webpage',
                '--user-agent', 'com.google.ios.youtube/19.08.2 (iPhone16,2; U; CPU iOS 17_3_1 like Mac OS X;)',
                '--force-ipv4',
                '-f', 'bestaudio',
                '-x', '--audio-format', 'mp3',
                '--download-sections', `*${start}-${end}`,
                '--no-mtime',
                '--concurrent-fragments', '5',
                '-o', outputPath,
                url
            ];
        } else {
            let formatSelector;
            switch (quality) {
                case '2160':
                    formatSelector = 'bestvideo[height>=2160][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height>=2160]+bestaudio/best';
                    break;
                case '1440':
                    formatSelector = 'bestvideo[height>=1440][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height>=1440]+bestaudio/best';
                    break;
                case '1080':
                    formatSelector = 'bestvideo[height>=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height>=1080]+bestaudio/best';
                    break;
                case '720':
                    formatSelector = 'bestvideo[height>=720][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height>=720]+bestaudio/best';
                    break;
                case '480':
                    formatSelector = 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=480]+bestaudio/best';
                    break;
                default:
                    formatSelector = 'bestvideo[height>=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height>=1080]+bestaudio/best';
            }

            args = [
                '--no-playlist',
                '--no-check-certificates',
                '--ffmpeg-location', ffmpegPath,
                '--extractor-args', 'youtube:player_client=ios;player_skip=webpage',
                '--user-agent', 'com.google.ios.youtube/19.08.2 (iPhone16,2; U; CPU iOS 17_3_1 like Mac OS X;)',
                '--force-ipv4',
                '-f', formatSelector,
                '--format-sort', 'res,ext:mp4:m4a,br',
                '--merge-output-format', 'mp4',
                '--download-sections', `*${start}-${end}`,
                '--postprocessor-args', 'ffmpeg:-c:v libx264 -preset superfast -crf 22 -c:a aac -b:a 128k -movflags +faststart',
                '--no-mtime',
                '--concurrent-fragments', '8',
                '--buffer-size', '16K',
                '--http-chunk-size', '10M',
                '-o', outputPath,
                url
            ];
        }

        logger.info(`Starting download: ${url} [${start}-${end}]`);

        const dlProcess = spawn(ytDlpPath, args);
        let errorOutput = '';

        dlProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
            logger.warn(`yt-dlp: ${data}`);
        });

        dlProcess.on('close', (code) => {
            if (code === 0 && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
                res.json({
                    success: true,
                    filename: outputFilename,
                    url: `/api/downloader/view/${outputFilename}`
                });
            } else {
                logger.error(`Download failed (code ${code}): ${errorOutput}`);
                res.status(500).json({ error: 'Download failed', details: errorOutput });
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/downloader/files
 */
router.get('/files', async (req, res) => {
    try {
        if (!fs.existsSync(MANUAL_DIR)) return res.json([]);
        const files = fs.readdirSync(MANUAL_DIR)
            .filter(f => f.startsWith('segment_'))
            .map(f => {
                const stats = fs.statSync(path.join(MANUAL_DIR, f));
                return {
                    filename: f,
                    url: `/api/downloader/view/${f}`,
                    size: stats.size,
                    created_at: stats.mtime
                };
            })
            .sort((a, b) => b.created_at - a.created_at);
        res.json(files);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * DELETE /api/downloader/files/:filename
 */
router.delete('/files/:filename', async (req, res) => {
    try {
        const filePath = path.join(MANUAL_DIR, req.params.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'File not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/downloader/view/:filename
 */
router.get('/view/:filename', (req, res) => {
    const filePath = path.join(MANUAL_DIR, req.params.filename);
    if (fs.existsSync(filePath)) {
        res.download(filePath, req.params.filename);
    } else {
        res.status(404).send('File not found');
    }
});

module.exports = router;