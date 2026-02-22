export async function checkRateLimit() {
  return { allowed: true };
}

export function getClientIp() {
  return 'unknown';
}

export function validateTrackParams() {
  return true;
}

export function validateAlbumParams() {
  return true;
}
