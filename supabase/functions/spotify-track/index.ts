import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
};

async function getToken(): Promise<string> {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(
        Deno.env.get('SPOTIFY_CLIENT_ID')! + ':' + Deno.env.get('SPOTIFY_CLIENT_SECRET')!
      ),
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const url = new URL(req.url);
  const trackId = url.searchParams.get('id');
  if (!trackId) return new Response('missing id', { status: 400, headers: CORS });

  try {
    const token = await getToken();
    const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: { 'Authorization': 'Bearer ' + token },
    });
    const track = await res.json();

    const payload = {
      title: track.name,
      artist: track.artists?.map((a: { name: string }) => a.name).join(', '),
      art: track.album?.images?.[1]?.url || track.album?.images?.[0]?.url || null,
      preview_url: track.preview_url || null,
    };

    return new Response(JSON.stringify(payload), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS });
  }
});
