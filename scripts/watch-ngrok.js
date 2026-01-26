#!/usr/bin/env node

/**
 * Ngrok URL Watcher
 * Automatically syncs ngrok URL to Vercel when it changes
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const NGROK_API = 'http://127.0.0.1:4040/api/tunnels';
const NGROK_START_API = 'http://127.0.0.1:1998/api/ollama/ngrok';
const SYNC_API = 'http://127.0.0.1:1998/api/ollama/ngrok/sync';
const HEADERS_SYNC_API = 'http://127.0.0.1:1998/api/ollama/headers/sync';
const CHECK_INTERVAL = 5000; // Check every 5 seconds (more responsive)
const ENV_FILE = path.join(process.cwd(), '.env.local');

let lastNgrokUrl = null;
let lastHeadersJson = null;
let isInitialSync = true;

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          // If status is not 200, reject
          if (res.statusCode < 200 || res.statusCode >= 300) {
              return reject(new Error(`HTTP ${res.statusCode}`));
          }
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

async function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body || {});
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    const req = http.request(url, options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode < 200 || res.statusCode >= 300) {
              // Try to parse error message
              try {
                  const json = JSON.parse(responseData);
                  const errorMessage = typeof json.error === 'string' && json.error.trim()
                    ? json.error.trim()
                    : `HTTP ${res.statusCode}`;
                  return reject(new Error(errorMessage));
              } catch {
                  const snippet = responseData ? responseData.slice(0, 200) : '';
                  return reject(new Error(snippet ? `HTTP ${res.statusCode}: ${snippet}` : `HTTP ${res.statusCode}`));
              }
          }
          resolve(JSON.parse(responseData));
        } catch (err) {
          const snippet = responseData ? responseData.slice(0, 200) : '';
          reject(new Error(snippet ? `Invalid JSON response: ${snippet}` : 'Invalid JSON response'));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function formatError(err) {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err instanceof Error && err.message) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function decodeEnvValue(rawValue) {
  let value = (rawValue || '').trim();
  if (!value) return '';
  const quote = value[0];
  if ((quote === '"' || quote === "'") && value.endsWith(quote)) {
    value = value.slice(1, -1);
    if (quote === '"') {
      value = value
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    }
    return value;
  }

  const commentIndex = value.indexOf(' #');
  if (commentIndex !== -1) {
    value = value.slice(0, commentIndex).trim();
  }
  return value;
}

function loadEnvLocal() {
  try {
    const raw = fs.readFileSync(ENV_FILE, 'utf8');
    const env = {};
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) return;
      const key = trimmed.slice(0, eqIndex).trim();
      const rawValue = trimmed.slice(eqIndex + 1);
      if (!key) return;
      env[key] = decodeEnvValue(rawValue);
    });
    return env;
  } catch {
    return {};
  }
}

function getCustomHeadersJson() {
  const env = loadEnvLocal();
  const rawHeaders = typeof env.OLLAMA_CUSTOM_HEADERS === 'string' ? env.OLLAMA_CUSTOM_HEADERS.trim() : '';
  if (rawHeaders) {
    try {
      JSON.parse(rawHeaders);
      return rawHeaders;
    } catch {
      // Fall through to derived headers
    }
  }

  const cfClientId = typeof env.OLLAMA_CF_ACCESS_CLIENT_ID === 'string' ? env.OLLAMA_CF_ACCESS_CLIENT_ID.trim() : '';
  const cfClientSecret =
    typeof env.OLLAMA_CF_ACCESS_CLIENT_SECRET === 'string'
      ? env.OLLAMA_CF_ACCESS_CLIENT_SECRET.trim()
      : '';
  if (cfClientId && cfClientSecret) {
    return JSON.stringify({
      'CF-Access-Client-Id': cfClientId,
      'CF-Access-Client-Secret': cfClientSecret,
    });
  }
  return '';
}

async function syncHeaders(headersJson) {
  try {
    console.log('🔐 Syncing OLLAMA_CUSTOM_HEADERS to Vercel...');
    const response = await postJson(HEADERS_SYNC_API, {
      headersJson,
      targets: ['production', 'preview'],
    });
    if (response.ok) {
      console.log('✅ Ollama headers synced to Vercel.');
      return true;
    }
    console.error(`❌ Header sync failed: ${response.error || 'Unknown error'}`);
    return false;
  } catch (err) {
    console.error(`❌ Failed to sync headers: ${err.message}`);
    return false;
  }
}

async function startNgrokViaApi() {
    console.log('🔌 Ngrok not found. Attempting to start via local API...');
    try {
        const res = await postJson(NGROK_START_API, {});
        if (res.ok && res.publicUrl) {
            console.log(`✅ Started ngrok via API: ${res.publicUrl}`);
            return res.publicUrl;
        } else {
            console.warn(`⚠️ Failed to start ngrok via API: ${res.error || 'Unknown error'}`);
            return null;
        }
    } catch (err) {
        console.warn(`⚠️ Could not contact local API to start ngrok: ${err.message}`);
        return null;
    }
}

async function getNgrokUrl() {
  try {
    const data = await fetchJson(NGROK_API);
    if (!data.tunnels || !Array.isArray(data.tunnels)) return null;

    const tunnel = data.tunnels.find(t =>
      t.public_url &&
      t.public_url.startsWith('https') &&
      (t.config?.addr?.includes('11434') || t.config?.addr === '11434')
    );

    return tunnel?.public_url || null;
  } catch (err) {
    return null;
  }
}

async function syncToVercel(ngrokUrl) {
  try {
    console.log(`🔄 Syncing ngrok URL to Vercel: ${ngrokUrl}`);
    const response = await postJson(SYNC_API, { targets: ['production', 'preview'] });

    if (response.ok) {
        if (response.message && response.message.includes("already up to date")) {
            console.log(`✅ Vercel is already up to date.`);
        } else {
            console.log(`✅ Successfully synced to Vercel!`);
            console.log(`🚀 Deployment triggered: ${response.url || 'N/A'}`);
        }
      return true;
    } else {
      console.error(`❌ Sync failed: ${response.error || 'Unknown error'}`);
      return false;
    }
  } catch (err) {
    console.error(`❌ Failed to sync: ${formatError(err)}`);
    return false;
  }
}

async function checkAndSync() {
  let currentNgrokUrl = await getNgrokUrl();

  if (!currentNgrokUrl) {
    // If we haven't seen it yet, or it died, try to start it
    currentNgrokUrl = await startNgrokViaApi();
    
    // If still null, wait for next tick
    if (!currentNgrokUrl) {
        if (lastNgrokUrl) {
             console.log('⚠️  Ngrok tunnel lost.');
             lastNgrokUrl = null;
        }
        return;
    }
  }

  if (currentNgrokUrl !== lastNgrokUrl) {
    if (isInitialSync) {
      console.log(`🌐 Detected ngrok tunnel: ${currentNgrokUrl}`);
      isInitialSync = false;
    } else {
      console.log(`🔄 Ngrok URL changed from ${lastNgrokUrl} to ${currentNgrokUrl}`);
    }

    const synced = await syncToVercel(currentNgrokUrl);
    if (synced) {
      lastNgrokUrl = currentNgrokUrl;
    }
  }

  const headersJson = getCustomHeadersJson();
  if (headersJson && headersJson !== lastHeadersJson) {
    const synced = await syncHeaders(headersJson);
    if (synced) {
      lastHeadersJson = headersJson;
    }
  }
}

async function main() {
  console.log('👀 Watching for ngrok URL changes...');
  console.log(`   Checking every ${CHECK_INTERVAL / 1000} seconds`);
  console.log('   Press Ctrl+C to stop\n');

  // Initial check
  await checkAndSync();

  // Periodic checks
  setInterval(checkAndSync, CHECK_INTERVAL);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping ngrok watcher...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Stopping ngrok watcher...');
  process.exit(0);
});

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
