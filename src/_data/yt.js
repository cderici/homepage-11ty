// Node 24 has fetch and .env loading built in; no extra packages needed.
try { process.loadEnvFile(); } catch { /* no .env file — fine */ }

const channelId = 'UCQUqjj5SfL9vfJxJ53ygN7w';   // your channel

export default async function () {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return {};                  // build still works without the secret
  const url =
    `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${key}`;

  const { items = [] } = await fetch(url).then(r => r.json());
  if (!items.length) return {};

  const { subscriberCount, videoCount, viewCount } = items[0].statistics;
  return { subscriberCount, videoCount, viewCount };
}

