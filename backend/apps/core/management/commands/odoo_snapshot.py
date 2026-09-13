"""Dump the Odoo database to a local JSON file: python manage.py odoo_snapshot

The import reads this file, not Odoo. That means the network is involved
exactly once, every later import run is offline and repeatable, and the file
doubles as an archive of the source as it stood on cutover day.

The dump contains the practice's entire patient list, including clinical notes.
It is written under a gitignored directory and should be treated like the
database itself.
"""

import json
from datetime import datetime, timezone

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.core import odoo

BATCH = 200

# Archived records are included: a patient hidden in Odoo is still history.
CONTEXT = {"context": {"active_test": False}}

MODELS = {
    "res.partner": [
        "id", "name", "is_company", "parent_id", "user_ids",
        "phone", "mobile", "email",
        "street", "street2", "city", "zip", "country_id",
        "comment", "category_id", "active", "create_date", "write_date",
    ],
    "calendar.event": [
        "id", "name", "start", "stop", "duration", "allday",
        "partner_ids", "user_id", "description",
        "active", "create_date", "write_date",
    ],
    "res.partner.category": ["id", "name", "color"],
}


class Command(BaseCommand):
    help = "Dumps res.partner, calendar.event and res.partner.category to a JSON archive."

    def add_arguments(self, parser):
        parser.add_argument(
            "--out",
            help="Destination file. Defaults to odoo_snapshots/odoo-snapshot-<timestamp>.json",
        )

    def fetch(self, model, fields):
        records, offset = [], 0
        while True:
            kwargs = {"fields": fields, "limit": BATCH, "offset": offset, "order": "id"}
            kwargs.update(CONTEXT)
            batch = odoo.execute_kw(model, "search_read", [[]], kwargs)
            records.extend(batch)
            self.stdout.write(f"  {model}: {len(records)}", ending="\r")
            self.stdout.flush()
            if len(batch) < BATCH:
                break
            offset += BATCH
        self.stdout.write(f"  {model}: {len(records)} records   ")
        return records

    def handle(self, *args, **options):
        self.stdout.write(f"Reading {settings.ODOO_DB!r} at {settings.ODOO_HOST}:{settings.ODOO_PORT}")

        try:
            version = odoo.version()["server_version"]
            data = {model: self.fetch(model, fields) for model, fields in MODELS.items()}
        except odoo.OdooError as error:
            raise CommandError(str(error))

        taken_at = datetime.now(timezone.utc)
        snapshot = {
            "taken_at": taken_at.isoformat(),
            "source": {
                "host": settings.ODOO_HOST,
                "database": settings.ODOO_DB,
                "server_version": version,
            },
            "counts": {model: len(records) for model, records in data.items()},
            "records": data,
        }

        if options["out"]:
            destination = settings.BASE_DIR / options["out"]
        else:
            stamp = taken_at.strftime("%Y%m%d-%H%M%S")
            destination = settings.BASE_DIR / "odoo_snapshots" / f"odoo-snapshot-{stamp}.json"
        destination.parent.mkdir(parents=True, exist_ok=True)

        with open(destination, "w", encoding="utf-8") as handle:
            json.dump(snapshot, handle, indent=2, ensure_ascii=False)

        size_mb = destination.stat().st_size / 1_048_576
        self.stdout.write(f"Wrote {destination} ({size_mb:.1f} MB)")
        self.stdout.write(
            self.style.SUCCESS(
                "Snapshot OK — "
                + ", ".join(f"{count} {model}" for model, count in snapshot["counts"].items())
            )
        )
