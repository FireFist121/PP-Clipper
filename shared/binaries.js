const path = require('path');
const os = require('os');

/**
 * Resolves the absolute path to a binary in the bin/ folder.
 * Appends .exe on Windows.
 * @param {string} name - Name of the binary (e.g., 'yt-dlp', 'ffmpeg')
 * @returns {string} - Absolute path to the binary
 */
function getBinaryPath(name) {
    const isWindows = os.platform() === 'win32';
    const binaryName = isWindows ? `${name}.exe` : name;
    
    // Check if we are in the root directory or server directory
    // We want the path relative to the project root
    const rootDir = process.cwd();
    return path.join(rootDir, 'bin', binaryName);
}

module.exports = {
    getBinaryPath,
    ytDlp: getBinaryPath('yt-dlp'),
    ffmpeg: getBinaryPath('ffmpeg'),
    aria2c: getBinaryPath('aria2c')
};
