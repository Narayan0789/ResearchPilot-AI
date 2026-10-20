import dns from 'dns/promises';
import net from 'net';

// Helper to determine if an IPv4 address is in a private/restricted range
function isPrivateIPv4(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // malformed, treat as unsafe
  }

  // 127.0.0.0/8 (Loopback)
  if (parts[0] === 127) return true;
  // 10.0.0.0/8 (Private)
  if (parts[0] === 10) return true;
  // 172.16.0.0/12 (Private: 172.16.0.0 - 172.31.255.255)
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // 192.168.0.0/16 (Private)
  if (parts[0] === 192 && parts[1] === 168) return true;
  // 169.254.0.0/16 (Link-local / Cloud metadata service)
  if (parts[0] === 169 && parts[1] === 254) return true;
  // 0.0.0.0/8 (Broadcast/Current network)
  if (parts[0] === 0) return true;
  // 224.0.0.0/4 (Multicast)
  if (parts[0] >= 224) return true;

  return false;
}

// Helper to determine if an IPv6 address is in a private/restricted range
function isPrivateIPv6(ip) {
  const lower = ip.toLowerCase();
  // ::1 (Loopback)
  if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;
  // Unique local addresses (fc00::/7)
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
  // Link-local addresses (fe80::/10)
  if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) return true;
  // IPv4-mapped IPv6 (::ffff:127.0.0.1, etc.)
  if (lower.includes('::ffff:')) {
    const v4 = lower.split('::ffff:')[1];
    if (net.isIPv4(v4)) return isPrivateIPv4(v4);
  }
  return false;
}

/**
 * Validates a target URL against SSRF vulnerabilities:
 * - Scheme must be http or https
 * - Host must not be empty or internal keywords
 * - Resolves hostname to IP and verifies IP is strictly public
 * @param {string} urlString
 * @returns {Promise<{ isValid: boolean, error?: string, parsedUrl?: URL, resolvedIp?: string }>}
 */
export async function validateSafeUrl(urlString) {
  try {
    if (!urlString || typeof urlString !== 'string') {
      return { isValid: false, error: 'URL must be a valid non-empty string' };
    }

    const parsed = new URL(urlString.trim());

    // Protocol check
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block obvious local/cloud metadata domains
    const blacklistedHosts = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      'metadata.google.internal',
      '169.254.169.254',
      'instance-data',
    ];
    if (blacklistedHosts.includes(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      return { isValid: false, error: 'Access to local or private hostnames is restricted' };
    }

    // Resolve IP address
    let resolvedIp;
    if (net.isIP(hostname)) {
      resolvedIp = hostname;
    } else {
      try {
        const addresses = await dns.lookup(hostname, { all: true });
        if (!addresses || addresses.length === 0) {
          return { isValid: false, error: `Could not resolve hostname ${hostname}` };
        }
        // Verify all resolved IPs
        for (const addr of addresses) {
          if (addr.family === 4 && isPrivateIPv4(addr.address)) {
            return { isValid: false, error: `Host resolves to private IPv4: ${addr.address}` };
          }
          if (addr.family === 6 && isPrivateIPv6(addr.address)) {
            return { isValid: false, error: `Host resolves to private IPv6: ${addr.address}` };
          }
        }
        resolvedIp = addresses[0].address;
      } catch (dnsErr) {
        return { isValid: false, error: `DNS resolution failed for ${hostname}: ${dnsErr.message}` };
      }
    }

    // Double check direct IP
    if (net.isIPv4(resolvedIp) && isPrivateIPv4(resolvedIp)) {
      return { isValid: false, error: 'Access to private IPv4 address is blocked' };
    }
    if (net.isIPv6(resolvedIp) && isPrivateIPv6(resolvedIp)) {
      return { isValid: false, error: 'Access to private IPv6 address is blocked' };
    }

    return { isValid: true, parsedUrl: parsed, resolvedIp };
  } catch (err) {
    return { isValid: false, error: `Invalid URL format: ${err.message}` };
  }
}
