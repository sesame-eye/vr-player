let currentFile = null;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_VIDEO_FILE') {
    currentFile = event.data.file;
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname === '/__local_video__') {
    event.respondWith(handleVideoRequest(event.request));
  }
});

async function handleVideoRequest(request) {
  if (!currentFile) {
    return new Response('動画が選択されていません', { status: 404 });
  }

  const fileSize = currentFile.size;
  const rangeHeader = request.headers.get('range');
  const contentType = currentFile.type || 'video/mp4';

  if (!rangeHeader) {
    return new Response(currentFile, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(fileSize),
        'Accept-Ranges': 'bytes'
      }
    });
  }

  const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
  const chunk = currentFile.slice(start, end + 1);

  return new Response(chunk, {
    status: 206,
    headers: {
      'Content-Type': contentType,
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes'
    }
  });
}
