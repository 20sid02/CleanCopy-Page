const UNIVERSAL_TRACKERS = new Set([
  // UTM
  "utm_source","utm_medium","utm_campaign","utm_term","utm_content",
  "utm_id","utm_name","utm_reader","utm_place","utm_pubreferrer",
  // Google
  "gclid","gbraid","wbraid","dclid","_ga","_gl","_gac",
  // Meta
  "fbclid",
  // Microsoft
  "msclkid",
  // Twitter/X
  "twclid",
  // Instagram
  "igshid","igsh",
  // TikTok
  "_t","tt_from","tt_content_id","embed_source",
  // Reddit
  "sh","rdt",
  // LinkedIn
  "trackingid","lipi","licu",
  // Mailchimp
  "mc_cid","mc_eid",
  // HubSpot
  "_hsenc","_hsmi",
  // Marketo
  "mkt_tok",
  // Yandex
  "yclid",
  // Impact Radius
  "irclickid",
  // Misc
  "ncid","s_cid","otc","zanpid","ref","source",
]);

function stripTrackers(url) {
  const u = new URL(url);
  for (const key of [...u.searchParams.keys()]) {
    if (UNIVERSAL_TRACKERS.has(key.toLowerCase())) u.searchParams.delete(key);
  }
  return u.toString();
}

function cleanYouTube(url) {
  const u = new URL(url);
  if (u.hostname === "youtu.be") {
    u.search = "";
    return u.toString();
  }
  const keep = new Set(["v","list","t","start","end"]);
  for (const key of [...u.searchParams.keys()]) {
    if (!keep.has(key)) u.searchParams.delete(key);
  }
  return u.toString();
}

function cleanAmazon(url) {
  const u = new URL(url);
  const markers = ["/dp/","/gp/product/","/ASIN/","/product/"];
  for (const m of markers) {
    const idx = u.pathname.indexOf(m);
    if (idx !== -1) {
      const after = u.pathname.slice(idx + m.length);
      const asin = after.split("/")[0];
      if (asin) return `https://${u.hostname}/dp/${asin}`;
    }
  }
  return stripTrackers(url);
}

function cleanEbay(url) {
  const u = new URL(url);
  const idx = u.pathname.indexOf("/itm/");
  if (idx !== -1) {
    const itemId = u.pathname.slice(idx + 5).split("/")[0];
    if (itemId) return `https://www.ebay.com/itm/${itemId}`;
  }
  return stripTrackers(url);
}

function cleanAliExpress(url) {
  const drop = new Set(["spm","pvid","algo_pvid","btsid","algo_exp_id","pdp_npi","gatewayadapt","sku_id"]);
  const u = new URL(url);
  for (const key of [...u.searchParams.keys()]) {
    if (drop.has(key.toLowerCase()) || UNIVERSAL_TRACKERS.has(key.toLowerCase())) {
      u.searchParams.delete(key);
    }
  }
  return u.toString();
}

function cleanSpotify(url) {
  const drop = new Set(["si","context","go"]);
  const u = new URL(url);
  for (const key of [...u.searchParams.keys()]) {
    if (drop.has(key) || UNIVERSAL_TRACKERS.has(key.toLowerCase())) u.searchParams.delete(key);
  }
  return u.toString();
}

function cleanSubstack(url) {
  const drop = new Set(["r"]);
  const u = new URL(url);
  for (const key of [...u.searchParams.keys()]) {
    if (drop.has(key) || UNIVERSAL_TRACKERS.has(key.toLowerCase())) u.searchParams.delete(key);
  }
  return u.toString();
}

function cleanTwitch(url) {
  const drop = new Set(["tt_content","tt_medium"]);
  const u = new URL(url);
  for (const key of [...u.searchParams.keys()]) {
    if (drop.has(key.toLowerCase()) || UNIVERSAL_TRACKERS.has(key.toLowerCase())) u.searchParams.delete(key);
  }
  return u.toString();
}

function cleanMedium(url) {
  const drop = new Set(["_branch_match_id","_branch_referrer"]);
  const u = new URL(url);
  for (const key of [...u.searchParams.keys()]) {
    if (drop.has(key.toLowerCase()) || UNIVERSAL_TRACKERS.has(key.toLowerCase())) u.searchParams.delete(key);
  }
  return u.toString();
}

function cleanShopify(url) {
  const drop = new Set(["_pos","_sid","_ss","variant"]);
  const u = new URL(url);
  for (const key of [...u.searchParams.keys()]) {
    if (drop.has(key.toLowerCase()) || UNIVERSAL_TRACKERS.has(key.toLowerCase())) u.searchParams.delete(key);
  }
  return u.toString();
}

export function cleanURL(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return { cleaned: "", wasDirty: false };

  let url;
  try {
    url = new URL(trimmed);
  } catch {
    return { cleaned: trimmed, wasDirty: false };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { cleaned: trimmed, wasDirty: false };
  }

  const host = url.hostname.toLowerCase();
  let result;

  if (host.includes("youtube.com") || host === "youtu.be") {
    result = cleanYouTube(trimmed);
  } else if (host.includes("amazon.")) {
    result = cleanAmazon(trimmed);
  } else if (host.includes("ebay.com") || host.includes("ebay.co")) {
    result = cleanEbay(trimmed);
  } else if (host.includes("aliexpress.com")) {
    result = cleanAliExpress(trimmed);
  } else if (host.includes("spotify.com")) {
    result = cleanSpotify(trimmed);
  } else if (host.includes("tiktok.com")) {
    result = stripTrackers(trimmed);
  } else if (host.includes("reddit.com")) {
    result = stripTrackers(trimmed);
  } else if (host.includes("substack.com")) {
    result = cleanSubstack(trimmed);
  } else if (host.includes("twitch.tv")) {
    result = cleanTwitch(trimmed);
  } else if (host.includes("medium.com")) {
    result = cleanMedium(trimmed);
  } else if (url.pathname.includes("/products/")) {
    result = cleanShopify(trimmed);
  } else {
    result = stripTrackers(trimmed);
  }

  return { cleaned: result, wasDirty: result !== trimmed };
}

export function removedParams(original, cleaned) {
  let origUrl, cleanUrl;
  try { origUrl = new URL(original); } catch { return []; }
  try { cleanUrl = new URL(cleaned); } catch { return []; }

  const origKeys = new Set([...origUrl.searchParams.keys()]);
  const cleanKeys = new Set([...cleanUrl.searchParams.keys()]);
  return [...origKeys].filter(k => !cleanKeys.has(k));
}
