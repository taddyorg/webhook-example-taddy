import { Redis } from 'iovalkey';

const url = process.env.VALKEY_URL;

if (!url) {
  throw new Error('VALKEY_URL is not set');
}

export const valkey = new Redis(url);