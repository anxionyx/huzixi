addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const targetDomain = "poki.com";
  const url = new URL(request.url);

  // 1. Route sub-resource requests correctly back to the target site
  url.hostname = targetDomain;
  url.protocol = "https:";

  // 2. Fetch the asset or page from the real server
  let response = await fetch(url.toString(), {
    headers: request.headers,
    method: request.method,
    body: request.method !== "GET" && request.method !== "HEAD" ? await request.blob() : null
  });

  // 3. Clone headers and remove security blocks
  let newHeaders = new Headers(response.headers);
  newHeaders.delete("X-Frame-Options");
  newHeaders.delete("Content-Security-Policy");
  newHeaders.set("Access-Control-Allow-Origin", "*");

  // 4. Content Type Check: Only rewrite text, HTML, or JavaScript
  const contentType = newHeaders.get("content-type") || "";
  if (contentType.includes("text") || contentType.includes("javascript") || contentType.includes("json")) {
    let text = await response.text();

    // 5. Case-Sensitive Replacements to "Hzx"
    // This replaces exact matches while preserving expected capitalization styles
    text = text
      .replace(/poki/g, "hzx")    // lowercase -> lowercase
      .replace(/Poki/g, "Hzx")    // Title Case -> Title Case
      .replace(/POKI/g, "HZX");   // UPPERCASE -> UPPERCASE

    return new Response(text, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  // 6. Return binaries (images, webassembly, audio) unmodified
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
