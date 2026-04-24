// Data migration: GitHub → Supabase
// Run: SB_SERVICE_KEY=<your-service-key> node migrate.mjs

const SUPABASE_URL = 'https://wtezfaxtpwjpqdmnmsny.supabase.co';
const serviceKey = process.env.SB_SERVICE_KEY;
if (!serviceKey) { console.error('set SB_SERVICE_KEY env var'); process.exit(1); }

const GITHUB_RAW = 'https://raw.githubusercontent.com/michiscoding/michiscoding.github.io/main';
const GITHUB_API = 'https://api.github.com/repos/michiscoding/michiscoding.github.io';
const HEADERS = { 'Authorization': `Bearer ${serviceKey}`, 'apikey': serviceKey };

// ── Supabase REST helpers ──────────────────────────────────────────────────

async function sbUpsert(table, record, onConflict) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`, {
        method: 'POST',
        headers: { ...HEADERS, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error(`upsert ${table}: ${await res.text()}`);
}

async function sbInsert(table, record) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: { ...HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error(`insert ${table}: ${await res.text()}`);
}

async function sbExists(table, column, value) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${encodeURIComponent(value)}&select=id&limit=1`, {
        headers: HEADERS,
    });
    const data = await res.json();
    return Array.isArray(data) && data.length > 0;
}

async function sbStorageUpload(storagePath, buffer, contentType) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/media/${storagePath}`, {
        method: 'POST',
        headers: { ...HEADERS, 'Content-Type': contentType || 'application/octet-stream', 'x-upsert': 'true' },
        body: buffer,
    });
    if (!res.ok) throw new Error(`storage upload ${storagePath}: ${await res.text()}`);
}

// ── File helpers ───────────────────────────────────────────────────────────

function contentTypeFromPath(p) {
    const ext = p.split('.').pop().toLowerCase();
    return { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
             webp: 'image/webp', mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' }[ext] || 'application/octet-stream';
}

async function downloadAndUpload(srcUrl, storagePath) {
    try {
        const res = await fetch(srcUrl);
        if (!res.ok) { console.warn(`  skip download (${res.status}): ${srcUrl}`); return null; }
        const buffer = await res.arrayBuffer();
        await sbStorageUpload(storagePath, buffer, contentTypeFromPath(storagePath));
        return storagePath;
    } catch (e) { console.warn(`  upload failed ${storagePath}: ${e.message}`); return null; }
}

// ── HTML parsers ───────────────────────────────────────────────────────────

function extractEntryContent(html) {
    const m = html.match(/<div class="entry-content">\s*<p>([\s\S]*?)<\/p>/i);
    return m ? m[1].replace(/<br>\n?/g, '\n').replace(/<br>/gi, '\n').trim() : '';
}

function extractH1(html) {
    const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    return m ? m[1].trim() : '';
}

function extractPaSection(html, keyword) {
    const sectionRe = /<div class="pa-section">([\s\S]*?)<\/div>/gi;
    let m;
    while ((m = sectionRe.exec(html))) {
        const block = m[1];
        if (new RegExp(keyword, 'i').test(block)) {
            const pMatch = block.match(/<p>([\s\S]*?)<\/p>/i);
            if (pMatch) return pMatch[1].trim();
        }
    }
    return '';
}

// ── 1. Entries ─────────────────────────────────────────────────────────────

async function migrateEntries() {
    console.log('\n── entries ──');
    const res = await fetch(`${GITHUB_API}/contents/entries`);
    const files = await res.json();
    const htmlFiles = files.filter(f => f.name.endsWith('.html') && f.name !== 'view.html' && /^\d{4}-\d{2}-\d{2}\.html$/.test(f.name));

    for (const file of htmlFiles) {
        const date = file.name.replace('.html', '');
        const rawRes = await fetch(file.download_url);
        const html = await rawRes.text();
        const content = extractEntryContent(html);
        try {
            await sbUpsert('entries', { date, content }, 'date');
            console.log(`  ✓ ${date}`);
        } catch (e) { console.error(`  ✗ ${date}: ${e.message}`); }
    }
}

// ── 2. Entry photos ────────────────────────────────────────────────────────

async function migrateEntryPhotos() {
    console.log('\n── entry photos ──');
    const treeRes = await fetch(`${GITHUB_API}/git/trees/main?recursive=1`);
    const { tree } = await treeRes.json();
    const photos = tree.filter(f => f.type === 'blob' && /^entries\/images\/[\d-]+\/.+\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)$/i.test(f.path));

    for (const f of photos) {
        const parts = f.path.split('/');
        const entryDate = parts[2];
        const filename = parts[3];
        const storagePath = `entry-photos/${entryDate}/${filename}`;

        if (await sbExists('entry_photos', 'storage_path', storagePath)) {
            console.log(`  skip (exists) ${storagePath}`);
            continue;
        }

        const uploaded = await downloadAndUpload(`${GITHUB_RAW}/${f.path}`, storagePath);
        if (uploaded) {
            try {
                await sbInsert('entry_photos', { entry_date: entryDate, storage_path: storagePath });
                console.log(`  ✓ ${storagePath}`);
            } catch (e) { console.error(`  ✗ ${storagePath}: ${e.message}`); }
        }
    }
}

// ── 3. Photos ──────────────────────────────────────────────────────────────

async function migratePhotos() {
    console.log('\n── photos ──');
    const res = await fetch(`${GITHUB_RAW}/photos.json`);
    const photos = await res.json();

    for (const photo of photos) {
        const src = photo.src;
        let storagePath;

        if (src.startsWith('http')) {
            // external URL — store as-is (no re-upload)
            storagePath = src;
        } else {
            // local GitHub path — download and upload
            const githubPath = src.startsWith('/') ? src.slice(1) : src;
            storagePath = githubPath; // e.g. "images/2026-04-08/filename.jpg"

            if (!await sbExists('photos', 'storage_path', storagePath)) {
                await downloadAndUpload(`${GITHUB_RAW}/${githubPath}`, storagePath);
            }
        }

        if (await sbExists('photos', 'storage_path', storagePath)) {
            console.log(`  skip (exists) ${storagePath.slice(0, 60)}`);
            continue;
        }

        try {
            await sbInsert('photos', { storage_path: storagePath, tags: photo.tags || [], date: photo.date || null });
            console.log(`  ✓ ${storagePath.slice(0, 60)}`);
        } catch (e) { console.error(`  ✗ ${storagePath.slice(0, 60)}: ${e.message}`); }
    }
}

// ── 4. Powerapps ───────────────────────────────────────────────────────────

async function migratePowerapps() {
    console.log('\n── powerapps ──');
    const res = await fetch(`${GITHUB_RAW}/powerapps.json`);
    const entries = await res.json();

    for (const entry of entries) {
        const htmlRes = await fetch(`${GITHUB_RAW}/powerapps/${entry.slug}.html`);
        if (!htmlRes.ok) { console.warn(`  skip ${entry.slug}: no html`); continue; }
        const html = await htmlRes.text();

        const what = extractPaSection(html, 'what');
        const how = extractPaSection(html, 'how');
        const tags = entry.tag ? entry.tag.split(',').map(t => t.trim()).filter(Boolean) : [];

        const mediaSrcs = entry.media ? (Array.isArray(entry.media) ? entry.media : [entry.media]).filter(Boolean) : [];
        const mediaPaths = [];

        for (const src of mediaSrcs) {
            const githubPath = src.startsWith('/') ? src.slice(1) : src;
            const filename = githubPath.split('/').pop();
            const storagePath = `powerapps/${filename}`;
            const uploaded = await downloadAndUpload(`${GITHUB_RAW}/${githubPath}`, storagePath);
            if (uploaded) mediaPaths.push(storagePath);
        }

        try {
            await sbUpsert('powerapps', { slug: entry.slug, title: entry.title, tags, what, how, media: mediaPaths }, 'slug');
            console.log(`  ✓ ${entry.slug}`);
        } catch (e) { console.error(`  ✗ ${entry.slug}: ${e.message}`); }
    }
}

// ── 5. Research ────────────────────────────────────────────────────────────

async function migrateResearch() {
    console.log('\n── research ──');
    const res = await fetch(`${GITHUB_API}/contents/r-entry`);
    if (!res.ok) { console.log('  none'); return; }
    const files = await res.json();
    const htmlFiles = files.filter(f => f.name.endsWith('.html') && f.name !== 'view.html');

    for (const file of htmlFiles) {
        const slug = file.name.replace('.html', '');
        const rawRes = await fetch(file.download_url);
        const html = await rawRes.text();
        const title = extractH1(html) || slug;
        const body = extractEntryContent(html);

        try {
            await sbUpsert('research', { slug, title, body }, 'slug');
            console.log(`  ✓ ${slug} (${title})`);
        } catch (e) { console.error(`  ✗ ${slug}: ${e.message}`); }
    }
}

// ── run ────────────────────────────────────────────────────────────────────

(async () => {
    console.log('starting migration...');
    await migrateEntries();
    await migrateEntryPhotos();
    await migratePhotos();
    await migratePowerapps();
    await migrateResearch();
    console.log('\ndone.');
})();
