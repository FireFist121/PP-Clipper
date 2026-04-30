const fs = require('fs');
const path = require('path');
const https = require('https');
const os = require('os');
const { execSync } = require('child_process');

const BIN_DIR = path.join(__dirname, '..', 'bin');
const YT_DLP_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
// Using a reliable static build of ffmpeg for Linux x64
const FFMPEG_URL = 'https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-linux-x64';

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                downloadFile(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

async function setup() {
    if (!fs.existsSync(BIN_DIR)) {
        fs.mkdirSync(BIN_DIR, { recursive: true });
        console.log(`Created directory: ${BIN_DIR}`);
    }

    const isLinux = os.platform() === 'linux';

    if (isLinux) {
        console.log('Detected Linux environment. Setting up binaries...');

        const ytDlpPath = path.join(BIN_DIR, 'yt-dlp');
        const ffmpegPath = path.join(BIN_DIR, 'ffmpeg');

        if (!fs.existsSync(ytDlpPath)) {
            console.log('Downloading yt-dlp for Linux...');
            await downloadFile(YT_DLP_URL, ytDlpPath);
            fs.chmodSync(ytDlpPath, '755');
            console.log('yt-dlp downloaded and set as executable.');
        } else {
            console.log('yt-dlp already exists.');
        }

        if (!fs.existsSync(ffmpegPath)) {
            console.log('Downloading ffmpeg for Linux...');
            await downloadFile(FFMPEG_URL, ffmpegPath);
            fs.chmodSync(ffmpegPath, '755');
            console.log('ffmpeg downloaded and set as executable.');
        } else {
            console.log('ffmpeg already exists.');
        }
    } else {
        console.log(`Detected ${os.platform()} environment. Skipping Linux binary download.`);
        console.log('Ensure you have yt-dlp.exe and ffmpeg.exe in the bin/ folder for local Windows development.');
    }
}

setup().catch(err => {
    console.error('Binary setup failed:', err);
    process.exit(1);
});
