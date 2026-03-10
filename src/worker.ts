import 'dotenv/config';
import { dequeueEvent } from './queue/index.js';
import {
  upsertPodcastSeries,
  upsertPodcastEpisode,
  deletePodcastSeries,
  deletePodcastEpisode,
} from './webhook/handler.js';
import type { WebhookPayload } from './webhook/types.js';

let running = true;

async function processEvents() {
  console.log('Worker started, waiting for events...');

  while (running) {
    const event = await dequeueEvent() as WebhookPayload | null;
    if (!event) continue;

    console.log(`Processing event: ${event.taddyType} ${event.action} ${event.uuid}`);

    try {
      switch (event.taddyType) {
        case 'podcastseries':
          if (event.action === 'deleted') {
            await deletePodcastSeries(event.data);
          } else {
            await upsertPodcastSeries(event.data);
          }
          break;
        case 'podcastepisode':
          if (event.action === 'deleted') {
            await deletePodcastEpisode(event.data);
          } else {
            await upsertPodcastEpisode(event.data);
          }
          break;
        case 'itunesinfo':
          console.log(`iTunesInfo event: ${event.action} ${event.uuid} — skipping (no DB table)`);
          break;
        default:
          console.log(`Skipping unknown taddyType: ${event.taddyType}`);
      }
    } catch (error) {
      console.error('Error processing event:', error);
    }
  }
}

function shutdown() {
  console.log('Shutting down worker...');
  running = false;
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

processEvents().then(() => {
  console.log('Worker stopped');
  process.exit(0);
});
