addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const targetDomain = "poki.com";
  const url = new URL(request.url);

  // 1. Maintain the routing path but shift the destination target
  url.hostname = targetDomain;
  url.protocol = "https:";

  // 2. Prepare request headers to blend into the target origin
  const newRequestHeaders = new Headers(request.headers);
  newRequestHeaders.set("Host", targetDomain);
  newRequestHeaders.set("Referer", `https://${targetDomain}/`);

  // 3. Fetch the asset or page from the real server
  let response = await fetch(url.toString(), {
    headers: newRequestHeaders,
    method: request.method,
    body: request.method !== "GET" && request.method !== "HEAD" ? await request.blob() : null
  });

  // 4. Clone headers and lift security restrictions for rendering
  let newHeaders = new Headers(response.headers);
  newHeaders.delete("X-Frame-Options");
  newHeaders.delete("Content-Security-Policy");
  newHeaders.set("Access-Control-Allow-Origin", "*");

  // 5. CRITICAL FIX: Only modify raw HTML text. Leave JS/JSON/Binaries completely untouched.
  const contentType = newHeaders.get("content-type") || "";
  if (contentType.includes("text/html")) {
    let text = await response.text();

    // Perform the case-sensitive visible text replacements
    text = text
      .replace(/poki(?!\.[a-z0-9_-]+)/g, "hzx")
      .replace(/Poki(?!\.[a-z0-9_-]+)/g, "Hzx")
      .replace(/POKI(?!\.[a-z0-9_-]+)/g, "HZX");

    return new Response(text, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  // 6. Pass back scripts, stylesheets, and binary assets cleanly without modification
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
