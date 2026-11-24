/**
 * Makes the share images in site/img/ with scripts/gen.php, using PHP GD from the pinned WordPress image.
 *
 * GD made the images that were tested, so it is kept to make the same files.
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

// On Linux, write the files as the current user instead of the image's default user.
const user = process.getuid && process.getgid ? ['--user', `${process.getuid()}:${process.getgid()}`] : [];
execFileSync('docker', ['compose', 'run', '--rm', ...user, 'gd', '/scripts/gen.php', '/img'], { cwd: join(import.meta.dirname, '..'), stdio: 'inherit' });
