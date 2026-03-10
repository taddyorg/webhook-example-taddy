import type { Request, Response } from 'express';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { podcastseries, podcastepisode } from '../db/schema.js';
import { enqueueEvent } from '../queue/index.js';
import type { WebhookPayload } from './types.js';

export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const payload = req.body as WebhookPayload;

  //Check secret in header
  const secret = req.headers['x-taddy-webhook-secret'];
  if (secret !== process.env.WEBHOOK_SECRET) {
    console.log('Webhook rejected: invalid secret');
    res.status(403).json({ error: 'Invalid webhook secret' });
    return;
  }

  console.log(`Received webhook: ${payload.taddyType} ${payload.action} ${payload.uuid}`);

  try {
    await enqueueEvent(payload);
    console.log(`Enqueued event: ${payload.taddyType} ${payload.action} ${payload.uuid}`);
    res.status(200).send();
  } catch (error) {
    console.error('Error enqueuing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function upsertPodcastSeries(data: Record<string, unknown>) {
  const values = {
    uuid: data.uuid as string,
    updatedAt: sql`now()`,
    source: data.source as string | undefined,
    hash: data.hash as string | undefined,
    hashTimestamp: data.hashTimestamp != null ? BigInt(data.hashTimestamp as number) : undefined,
    genresHash: data.genresHash as string | undefined,
    itunesInfoHash: data.itunesInfoHash as string | undefined,
    datePublished: data.datePublished != null
      ? new Date((data.datePublished as number) * 1000).toISOString()
      : undefined,
    name: data.name as string | undefined,
    description: data.description as string | undefined,
    imageUrl: data.imageUrl as string | undefined,
    itunesId: data.itunesId != null ? BigInt(data.itunesId as number) : undefined,
    seriesType: data.seriesType as string | undefined,
    copyright: data.copyright as string | undefined,
    countryOfOrigin: data.countryOfOrigin as string | undefined,
    language: data.language as string | undefined,
    websiteUrl: data.websiteUrl as string | undefined,
    authorName: data.authorName as string | undefined,
    contentType: data.contentType as string | undefined,
    rssUrl: data.rssUrl as string | undefined,
    rssOwnerName: data.rssOwnerName as string | undefined,
    rssOwnerPublicEmail: data.rssOwnerPublicEmail as string | undefined,
    isExplicitContent: data.isExplicitContent as boolean | undefined,
    isCompleted: data.isCompleted as boolean | undefined,
    isBlocked: data.isBlocked as boolean | undefined,
    childrenHash: data.childrenHash as string | undefined,
    rssPersonsHash: data.rssPersonsHash as string | undefined,
    transcribeStatus: data.transcribeStatus as string | undefined,
    genres: (data.genres as string[]) ?? [],
  };

  await db
    .insert(podcastseries)
    .values(values)
    .onConflictDoUpdate({
      target: podcastseries.uuid,
      set: values,
    });

  console.log(`Upserted podcast series: ${values.uuid}`);
}

export async function upsertPodcastEpisode(data: Record<string, unknown>) {
  const values = {
    uuid: data.uuid as string,
    updatedAt: sql`now()`,
    hash: data.hash as string | undefined,
    hashTimestamp: data.hashTimestamp != null ? BigInt(data.hashTimestamp as number) : undefined,
    datePublished: data.datePublished != null
      ? new Date((data.datePublished as number) * 1000).toISOString()
      : undefined,
    name: data.name as string | undefined,
    description: data.description as string | undefined,
    imageUrl: data.imageUrl as string | undefined,
    seriesUuid: (data.podcastSeries as Record<string, unknown> | undefined)?.uuid as string | undefined,
    guid: data.guid as string,
    seriesUuidPlusGuid: (() => {
      const seriesUuid = (data.podcastSeries as Record<string, unknown> | undefined)?.uuid as string | undefined;
      const guid = data.guid as string | undefined;
      return seriesUuid && guid ? `${seriesUuid}_${guid}` : undefined;
    })(),
    subtitle: data.subtitle as string | undefined,
    audioUrl: data.audioUrl as string | undefined,
    videoUrl: data.videoUrl as string | undefined,
    fileLength: data.fileLength as number | undefined,
    fileType: data.fileType as string | undefined,
    duration: data.duration as number | undefined,
    seasonNumber: data.seasonNumber as number | undefined,
    episodeNumber: data.episodeNumber as number | undefined,
    episodeType: data.episodeType as string | undefined,
    websiteUrl: data.websiteUrl as string | undefined,
    isExplicitContent: data.isExplicitContent as boolean | undefined,
    isRemoved: data.isRemoved as boolean | undefined,
    seriesHash: data.seriesHash as string | undefined,
    isBlocked: data.isBlocked as boolean | undefined,
    rssTranscripts: data.rssTranscripts ?? undefined,
    rssChapters: data.rssChapters ?? undefined,
    rssPersonsHash: data.rssPersonsHash as string | undefined,
    transcribeStatus: data.transcribeStatus as string | undefined,
    taddyTranscriptUrl: data.taddyTranscriptUrl as string | undefined,
    taddyChunksUrl: data.taddyChunksUrl as string | undefined,
    taddyChapterUrl: data.taddyChapterUrl as string | undefined,
  };

  await db
    .insert(podcastepisode)
    .values(values)
    .onConflictDoUpdate({
      target: podcastepisode.uuid,
      set: values,
    });

  console.log(`Upserted podcast episode: ${values.uuid}`);
}

export async function deletePodcastSeries(data: Record<string, unknown>) {
  await db.delete(podcastseries).where(eq(podcastseries.uuid, data.uuid as string));
  console.log(`Deleted podcast series: ${data.uuid}`);
}

export async function deletePodcastEpisode(data: Record<string, unknown>) {
  await db.delete(podcastepisode).where(eq(podcastepisode.uuid, data.uuid as string));
  console.log(`Deleted podcast episode: ${data.uuid}`);
}
