"""Odoo XML-RPC client.

The Odoo server runs on another machine on the practice LAN and is reached by
its mDNS name, not a fixed address — its IP changes whenever the network does,
so the name has to be resolved at runtime. Windows resolves ".local" names
slowly and fails intermittently, so an address is resolved once and reused:
looking it up on every request would put that latency on every API call.

A call that fails at the connection level is retried once against a freshly
resolved address, which is what recovers from the server moving to a new IP.
"""

import socket
import threading
import time
import xmlrpc.client

from django.conf import settings


class OdooError(Exception):
    pass


# Guards the cached address and uid. Re-entrant because _uid() holds it while
# issuing the authenticate call, which resolves the address in turn.
_lock = threading.RLock()
_address_cache = None
_resolved_at = 0.0
_uid_cache = None


def _resolve():
    last_error = None
    for attempt in range(settings.ODOO_RESOLVE_RETRIES):
        try:
            # AF_INET only: mDNS also answers with a link-local IPv6 address,
            # which is not reliably routable.
            return socket.getaddrinfo(settings.ODOO_HOST, None, socket.AF_INET)[0][4][0]
        except socket.gaierror as error:
            last_error = error
            if attempt + 1 < settings.ODOO_RESOLVE_RETRIES:
                time.sleep(settings.ODOO_RESOLVE_RETRY_DELAY)
    raise OdooError(f"Could not resolve {settings.ODOO_HOST}: {last_error}")


def address(refresh=False):
    global _address_cache, _resolved_at
    with _lock:
        expired = time.monotonic() - _resolved_at > settings.ODOO_RESOLVE_TTL
        if refresh or _address_cache is None or expired:
            try:
                _address_cache = _resolve()
                _resolved_at = time.monotonic()
            except OdooError:
                # Windows answers ".local" lookups unreliably once the record
                # has dropped out of its cache (the mDNS TTL is 60s), so a
                # previously working address is worth trying before failing.
                if _address_cache is None:
                    raise
        return _address_cache


def _call(endpoint, method, *args):
    last_error = None
    for attempt in range(2):
        url = f"http://{address(refresh=attempt > 0)}:{settings.ODOO_PORT}/xmlrpc/2/{endpoint}"
        try:
            return getattr(xmlrpc.client.ServerProxy(url), method)(*args)
        except (OSError, xmlrpc.client.ProtocolError) as error:
            last_error = error
    raise OdooError(f"Odoo call {endpoint}.{method} failed: {last_error}")


def _uid():
    global _uid_cache
    with _lock:
        if _uid_cache is None:
            uid = _call(
                "common",
                "authenticate",
                settings.ODOO_DB,
                settings.ODOO_USERNAME,
                settings.ODOO_PASSWORD,
                {},
            )
            if not uid:
                raise OdooError(
                    f"Odoo rejected the credentials for {settings.ODOO_USERNAME!r} "
                    f"on database {settings.ODOO_DB!r}"
                )
            _uid_cache = uid
        return _uid_cache


def version():
    """Server version info. Needs no credentials, so it also serves as a
    reachability check."""
    return _call("common", "version")


def execute_kw(model, method, args, kwargs=None):
    """Calls `method` on an Odoo `model`, e.g.
    execute_kw("res.partner", "search_read", [[]], {"fields": ["name"]})."""
    return _call(
        "object",
        "execute_kw",
        settings.ODOO_DB,
        _uid(),
        settings.ODOO_PASSWORD,
        model,
        method,
        args,
        kwargs or {},
    )
