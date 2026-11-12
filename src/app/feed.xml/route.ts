import {getUpdates} from '@/lib/data';
import {SITE_URL} from '@/lib/seo';

export const dynamic = 'force-static';

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Atom feed of the dated log on the updates page.
export function GET() {
  const updates = getUpdates();
  const entries = updates.map(entry => {
    const stamp = `${entry.date}T12:00:00Z`;
    const link = entry.url ?? `${SITE_URL}/en/updates`;
    return `  <entry>
    <id>tag:nexoresearch.org,${entry.date}:${escape(entry.kind + '-' + entry.title.en.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}</id>
    <title>${escape(entry.title.en)}</title>
    <updated>${stamp}</updated>
    <link href="${escape(link)}"/>
    <summary>${escape(entry.body.en)}</summary>
  </entry>`;
  }).join('\n');
  const body = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${SITE_URL}/feed.xml</id>
  <title>NEXO Research Institute · Updates</title>
  <updated>${updates[0] ? updates[0].date + 'T12:00:00Z' : new Date(0).toISOString()}</updated>
  <author><name>NEXO Research Institute</name></author>
  <link rel="self" href="${SITE_URL}/feed.xml"/>
  <link href="${SITE_URL}/en/updates"/>
${entries}
</feed>
`;
  return new Response(body, {headers: {'Content-Type': 'application/atom+xml; charset=utf-8'}});
}
