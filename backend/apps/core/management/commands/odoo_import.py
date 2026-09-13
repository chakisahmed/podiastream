"""Import an Odoo snapshot into the practice database.

    python manage.py odoo_import --snapshot odoo_snapshots/odoo-snapshot-....json

Runs as a dry run unless --commit is passed. The dry run does the real work
inside a transaction and rolls it back, so constraint violations surface before
anything is kept.

Two sources describe the same history and they are not equally trustworthy:

  res.partner.category  date-tags attached directly to a patient. No time of
                        day, but the attribution is exact -- it is a database
                        relation, not a guess.
  calendar.event        real start/stop times, but the patient is named in a
                        free-text subject. Only ~39% of those subjects resolve
                        to exactly one contact.

So the tags drive the history, and a calendar event only contributes its times
when it matches one patient exactly and falls on a date that patient is already
tagged with. Unmatched past events are left in the snapshot archive rather than
guessed into the record. Future events are never imported here -- they are
written to a CSV for a human, because an appointment nobody shows up to is
worse than one that needs typing in.
"""

import csv
import html as html_module
import json
import re
import unicodedata
from collections import defaultdict
from datetime import date, datetime, time
from datetime import timezone as dt_timezone

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone as djtz
from django.utils.html import strip_tags

from apps.appointments.models import Appointment
from apps.patients.models import Patient

# Tag dates run from year 0202 to 2055 in the real data; anything outside this
# window is a typo rather than a visit.
SANE_FROM = date(2015, 1, 1)
SANE_TO = date(2030, 12, 31)

DATE_TAG = re.compile(r"^\s*(\d{1,2})\s*[/\-.]\s*(\d{1,2})\s*[/\-.]\s*(\d{2,4})\s*$")
# "0109/2026" -- the first separator never got typed.
MISSING_SEP = re.compile(r"^\s*(\d{2})(\d{2})\s*[/\-.]\s*(\d{4})\s*$")

DATE_ONLY_NOTE = "Importé depuis Odoo — date seule (heure inconnue)"


class Rollback(Exception):
    """Raised to undo a dry run."""


def html_to_text(raw):
    """Odoo's comment field is HTML. Keep every character of the text, drop the
    markup -- the shorthand inside is the practitioner's and is never parsed."""
    if not raw or raw == "false":
        return ""
    text = re.sub(r"<\s*br\s*/?\s*>", "\n", raw, flags=re.I)
    text = re.sub(r"<\s*/\s*(p|div|li)\s*>", "\n", text, flags=re.I)
    text = strip_tags(text)
    text = html_module.unescape(text)
    lines = [line.rstrip() for line in text.splitlines()]
    return re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()


def normalise(value):
    """Fold a name or a calendar subject to a comparable form."""
    value = unicodedata.normalize("NFKD", (value or "").lower())
    value = "".join(c for c in value if not unicodedata.combining(c))
    value = re.sub(r"\d{1,2}\s*[:h]\s*\d{0,2}", " ", value)
    value = re.sub(r"[^a-z\s]", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def split_name(full):
    """Last whitespace-separated token is the surname; the rest is the given
    name. Correct for the compound given names in this data (abdel razek /
    khleifia) and wrong for compound surnames, which the review pass surfaces."""
    parts = (full or "").strip().split()
    if not parts:
        return "", ""
    if len(parts) == 1:
        return "", parts[0]
    return " ".join(parts[:-1]), parts[-1]


def parse_tag_date(name):
    """Returns (date, recovered) or (None, reason)."""
    match = DATE_TAG.match(name or "")
    recovered = False
    if not match:
        match = MISSING_SEP.match(name or "")
        recovered = bool(match)
    if not match:
        return None, "not a date"

    day, month, year = (int(part) for part in match.groups())
    if year < 100:
        year += 2000
    try:
        parsed = date(year, month, day)
    except ValueError:
        return None, "impossible date"
    if not (SANE_FROM <= parsed <= SANE_TO):
        return None, "out of range (%s)" % parsed
    return parsed, recovered


def parse_odoo_dt(value):
    """Odoo hands back naive UTC strings."""
    if not value:
        return None
    return datetime.strptime(value, "%Y-%m-%d %H:%M:%S").replace(tzinfo=dt_timezone.utc)


class Command(BaseCommand):
    help = "Imports patients and visit history from an Odoo snapshot."

    def add_arguments(self, parser):
        parser.add_argument("--snapshot", required=True, help="Path to the snapshot JSON")
        parser.add_argument("--commit", action="store_true", help="Actually keep the changes")
        parser.add_argument("--future-csv", default="odoo_snapshots/future_events.csv")

    # -- loading -----------------------------------------------------------
    def handle(self, *args, **options):
        from django.conf import settings

        path = settings.BASE_DIR / options["snapshot"]
        if not path.exists():
            raise CommandError("No snapshot at %s" % path)

        with open(path, encoding="utf-8") as handle:
            snapshot = json.load(handle)

        partners = snapshot["records"]["res.partner"]
        events = snapshot["records"]["calendar.event"]
        categories = {c["id"]: c["name"] for c in snapshot["records"]["res.partner.category"]}

        self.stdout.write("Snapshot taken %s from %s"
                          % (snapshot["taken_at"][:19], snapshot["source"]["database"]))

        try:
            with transaction.atomic():
                importable = self.select_patients(partners)
                patient_by_odoo = self.import_patients(importable)
                self.import_history(importable, categories, events, patient_by_odoo)
                self.import_upcoming(events, importable, patient_by_odoo)
                self.write_future_csv(events, importable, options["future_csv"], settings.BASE_DIR)
                if not options["commit"]:
                    raise Rollback()
        except Rollback:
            self.stdout.write(self.style.WARNING(
                "\nDRY RUN — everything above was rolled back. Re-run with --commit to keep it."))
            return

        self.stdout.write(self.style.SUCCESS("\nCommitted."))

    # -- patients ----------------------------------------------------------
    def select_patients(self, partners):
        candidates = [p for p in partners
                      if not p.get("is_company") and not p.get("user_ids") and not p.get("parent_id")]

        # Odoo's own scaffolding (OdooBot, Public user, the user templates) has
        # an empty user_ids because those users are archived, so it survives the
        # filter above. What separates it from a sparsely-filled real patient is
        # that it is archived AND carries nothing clinical at all.
        def is_odoo_scaffolding(partner):
            return (
                not partner.get("active", True)
                and not partner.get("category_id")
                and not (partner.get("comment") or "").strip()
                and not partner.get("phone")
                and not partner.get("mobile")
            )

        keep, dropped = [], []
        for partner in candidates:
            (dropped if is_odoo_scaffolding(partner) else keep).append(partner)

        self.stdout.write("\n=== patients ===")
        self.stdout.write("  %d of %d partner rows are individuals"
                          % (len(keep), len(partners)))
        if dropped:
            self.stdout.write("  skipped %d Odoo system records: %s"
                              % (len(dropped), ", ".join(p.get("name") or "?" for p in dropped)))
        return keep

    def import_patients(self, partners):
        created = updated = noted = 0
        mapping = {}
        for partner in partners:
            first, last = split_name(partner.get("name"))
            address = ", ".join(
                str(part) for part in (
                    partner.get("street"), partner.get("street2"),
                    partner.get("city"), partner.get("zip"),
                ) if part
            )
            notes = html_to_text(partner.get("comment"))
            if notes:
                noted += 1
            obj, was_created = Patient.objects.update_or_create(
                odoo_partner_id=partner["id"],
                defaults={
                    "first_name": first,
                    "last_name": last,
                    "phone": partner.get("phone") or partner.get("mobile") or "",
                    "email": partner.get("email") or "",
                    "address": address,
                    "medical_background": notes,
                    "is_active": bool(partner.get("active", True)),
                },
            )
            mapping[partner["id"]] = obj
            created += was_created
            updated += not was_created

        self.stdout.write("  created %d, updated %d" % (created, updated))
        self.stdout.write("  %d carried clinical notes (HTML converted to text)" % noted)
        return mapping

    # -- history -----------------------------------------------------------
    def import_history(self, partners, categories, events, patient_by_odoo):
        self.stdout.write("\n=== visit history (date-tags) ===")

        # Which calendar events resolve to exactly one patient?
        index = defaultdict(list)
        for partner in partners:
            index[normalise(partner.get("name"))].append(partner["id"])

        today = djtz.localdate()
        times_for = {}
        for event in events:
            start = parse_odoo_dt(event.get("start"))
            if not start or djtz.localtime(start).date() >= today:
                continue
            hits = index.get(normalise(event.get("name")), [])
            if len(hits) != 1:
                continue
            key = (hits[0], djtz.localtime(start).date())
            times_for.setdefault(key, event)

        self.stdout.write("  %d past events resolve to exactly one patient" % len(times_for))

        rejected = defaultdict(list)
        recovered_tags = []
        timed = dateonly = skipped = 0

        for partner in partners:
            patient = patient_by_odoo[partner["id"]]
            for category_id in partner.get("category_id") or []:
                raw = categories.get(category_id, "")
                parsed, note = parse_tag_date(raw)
                if not parsed:
                    rejected[note].append(raw)
                    continue
                if note is True:
                    recovered_tags.append(raw)

                event = times_for.get((partner["id"], parsed))
                if event:
                    start = parse_odoo_dt(event["start"])
                    end = parse_odoo_dt(event.get("stop")) or start
                    odoo_event_id = event["id"]
                    notes = event.get("name") or ""
                else:
                    start = djtz.make_aware(datetime.combine(parsed, time(0, 0)))
                    end = start
                    odoo_event_id = None
                    notes = DATE_ONLY_NOTE

                if odoo_event_id is not None:
                    if Appointment.objects.filter(odoo_event_id=odoo_event_id).exists():
                        skipped += 1
                        continue
                elif Appointment.objects.filter(patient=patient, start_time=start).exists():
                    skipped += 1
                    continue

                Appointment.objects.create(
                    patient=patient,
                    practitioner=None,
                    appointment_type=Appointment.AppointmentType.SUIVI_CONTROLE,
                    status=Appointment.Status.HONORE,
                    start_time=start,
                    end_time=end,
                    notes=notes,
                    odoo_event_id=odoo_event_id,
                )
                if event:
                    timed += 1
                else:
                    dateonly += 1

        self.stdout.write("  imported %d visits with a real time (from a matched event)" % timed)
        self.stdout.write("  imported %d date-only visits" % dateonly)
        if skipped:
            self.stdout.write("  skipped %d already present (re-run is additive)" % skipped)
        if recovered_tags:
            self.stdout.write(self.style.WARNING(
                "  recovered %d malformed tags (missing separator): %s"
                % (len(recovered_tags), ", ".join(sorted(set(recovered_tags))[:10]))))
        for reason, names in sorted(rejected.items()):
            sample = ", ".join(sorted(set(names))[:6])
            self.stdout.write(self.style.WARNING(
                "  rejected %d tags — %s: %s" % (len(names), reason, sample)))

    # -- upcoming ----------------------------------------------------------
    def import_upcoming(self, events, partners, patient_by_odoo):
        """Every future event comes across, because a booking nobody shows up
        to is worse than one that needs tidying. Only an exact, unique name
        match gets linked to a patient -- everything else keeps the name it was
        booked under, which is how the practice works anyway: the record is
        created when the person actually arrives."""
        self.stdout.write("\n=== upcoming appointments ===")

        index = defaultdict(list)
        for partner in partners:
            index[normalise(partner.get("name"))].append(partner["id"])

        today = djtz.localdate()
        linked = unlinked = absences = skipped = 0

        for event in events:
            start = parse_odoo_dt(event.get("start"))
            if not start or djtz.localtime(start).date() < today:
                continue
            if Appointment.objects.filter(odoo_event_id=event["id"]).exists():
                skipped += 1
                continue

            subject = event.get("name") or ""
            folded = normalise(subject)
            hits = index.get(folded, [])
            patient = patient_by_odoo[hits[0]] if len(hits) == 1 else None

            # "congé" is the French for leave -- reading it as such is not a
            # guess about a patient, it is the word meaning time off.
            is_absence = "conge" in folded.split() or folded == "conge"

            Appointment.objects.create(
                patient=patient,
                booked_name="" if patient else subject,
                practitioner=None,
                appointment_type=(Appointment.AppointmentType.ABSENCE if is_absence
                                  else Appointment.AppointmentType.SUIVI_CONTROLE),
                status=Appointment.Status.CONFIRME,
                start_time=start,
                end_time=parse_odoo_dt(event.get("stop")) or start,
                notes="" if patient else subject,
                odoo_event_id=event["id"],
            )
            if is_absence:
                absences += 1
            elif patient:
                linked += 1
            else:
                unlinked += 1

        self.stdout.write("  %d linked to a patient by exact name match" % linked)
        self.stdout.write("  %d kept under the name they were booked under" % unlinked)
        self.stdout.write("  %d marked as absence / congé" % absences)
        if skipped:
            self.stdout.write("  skipped %d already present" % skipped)

    # -- future events -----------------------------------------------------
    def write_future_csv(self, events, partners, relative, base_dir):
        from difflib import SequenceMatcher

        today = djtz.localdate()
        future = []
        for event in events:
            start = parse_odoo_dt(event.get("start"))
            if start and djtz.localtime(start).date() >= today:
                future.append((start, event))
        future.sort(key=lambda pair: pair[0])

        names = [(normalise(p.get("name")), p) for p in partners]
        destination = base_dir / relative
        destination.parent.mkdir(parents=True, exist_ok=True)

        with open(destination, "w", encoding="utf-8-sig", newline="") as handle:
            writer = csv.writer(handle)
            writer.writerow([
                "odoo_event_id", "start", "end", "subject",
                "candidate_1", "candidate_1_odoo_id", "score",
                "candidate_2", "candidate_2_odoo_id",
                "candidate_3", "candidate_3_odoo_id",
                "CHOSEN_odoo_partner_id",
            ])
            for start, event in future:
                subject = event.get("name") or ""
                target = normalise(subject)
                ranked = sorted(
                    ((SequenceMatcher(None, target, name).ratio(), partner)
                     for name, partner in names),
                    key=lambda pair: pair[0], reverse=True,
                )[:3]
                end = parse_odoo_dt(event.get("stop")) or start
                row = [
                    event["id"],
                    djtz.localtime(start).strftime("%Y-%m-%d %H:%M"),
                    djtz.localtime(end).strftime("%Y-%m-%d %H:%M"),
                    subject,
                ]
                for position, (score, partner) in enumerate(ranked):
                    row.extend([partner["name"], partner["id"]])
                    if position == 0:
                        row.append("%.2f" % score)
                row.append("")  # CHOSEN_odoo_partner_id — filled in by hand
                writer.writerow(row)

        self.stdout.write("\n=== upcoming appointments ===")
        self.stdout.write("  %d future events written to %s" % (len(future), destination))
        self.stdout.write("  fill CHOSEN_odoo_partner_id for each, then import them in the review pass")
