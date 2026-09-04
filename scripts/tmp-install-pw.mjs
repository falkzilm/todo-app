import dns from 'node:dns';
import net from 'node:net';
dns.setDefaultResultOrder('ipv4first');
net.setDefaultAutoSelectFamily(false);

const originalLookup = dns.lookup;
dns.lookup = function patchedLookup(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  const forcedOptions = { ...options, family: 4, all: false, verbatim: false };
  originalLookup.call(dns, hostname, forcedOptions, callback);
};

const { program } = await import('playwright/lib/program');
program.parse(['node', 'playwright', 'install', 'chromium']);
