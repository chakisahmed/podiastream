"""Connectivity check for the Odoo server: python manage.py odoo_check"""

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.core import odoo


class Command(BaseCommand):
    help = "Checks that the Odoo server is reachable and the credentials work."

    def handle(self, *args, **options):
        self.stdout.write(f"Host: {settings.ODOO_HOST}:{settings.ODOO_PORT}")

        try:
            version = odoo.version()
        except odoo.OdooError as error:
            raise CommandError(str(error))

        self.stdout.write(f"Reachable at {odoo.address()} — Odoo {version['server_version']}")

        try:
            partners = odoo.execute_kw(
                "res.partner",
                "search_read",
                [[]],
                {"fields": ["id", "name"], "limit": 5},
            )
        except odoo.OdooError as error:
            raise CommandError(str(error))

        self.stdout.write(f"Authenticated on {settings.ODOO_DB!r}, fetched {len(partners)} partner(s):")
        for partner in partners:
            self.stdout.write(f"  [{partner['id']}] {partner['name']}")

        self.stdout.write(self.style.SUCCESS("Odoo connection OK"))
