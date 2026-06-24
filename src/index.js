addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const targetDomain = "poki.com";
  const url = new URL(request.url);

  // 1. Route subpages and resources correctly back to the target site
  url.hostname = targetDomain;
  url.protocol = "https:";

  // 2. Fetch the asset or page from the real server
  let response = await fetch(url.toString(), {
    headers: request.headers,
    method: request.method,
    body: request.method !== "GET" && request.method !== "HEAD" ? await request.blob() : null
  });

  // 3. Clone headers and lift security layout restrictions
  let newHeaders = new Headers(response.headers);
  newHeaders.delete("X-Frame-Options");
  newHeaders.delete("Content-Security-Policy");
  newHeaders.set("Access-Control-Allow-Origin", "*");

  // 4. Content Type Check: Only translate text-based webpage layouts
  const contentType = newHeaders.get("content-type") || "";
  if (contentType.includes("text") || contentType.includes("javascript") || contentType.includes("json")) {
    let text = await response.text();

    // 5. Smart Case-Sensitive Replacements
    // Negative lookahead (?!\.[a-z0-9_-]+) prevents matching strings inside URLs/extensions (e.g. poki.com, poki.js)
    text = text
      .replace(/poki(?!\.[a-z0-9_-]+)/g, "hzx")   // lowercase -> lowercase
      .replace(/Poki(?!\.[a-z0-9_-]+)/g, "Hzx")   // Title Case -> Title Case
      .replace(/POKI(?!\.[a-z0-9_-]+)/g, "HZX");  // UPPERCASE -> UPPERCASE

    return new Response(text, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  // 6. Return raw binaries (images, icons, webassembly, audio) completely unmodified
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
