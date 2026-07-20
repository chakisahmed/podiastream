"""Local-disk file storage.

All patient data — including uploaded files — must stay on this machine
(no foreign-hosted storage), so files are written directly to MEDIA_ROOT
instead of being handed off to a cloud storage provider. Callers deal in
"buckets" (a subdirectory under MEDIA_ROOT, e.g. "patient-documents") the
same way they would with a cloud storage bucket.
"""

import os

from django.conf import settings
from django.core.files.storage import FileSystemStorage


def _storage_for(bucket: str) -> FileSystemStorage:
    return FileSystemStorage(location=os.path.join(settings.MEDIA_ROOT, bucket))


def save_file(bucket: str, path: str, file) -> str:
    """Saves an uploaded file under MEDIA_ROOT/<bucket>/<path>, returning the
    (possibly de-duplicated) path actually used."""
    return _storage_for(bucket).save(path, file)


def open_file(bucket: str, path: str):
    """Returns a read-only file handle for a previously saved file."""
    return _storage_for(bucket).open(path, "rb")


def delete_file(bucket: str, path: str) -> None:
    storage = _storage_for(bucket)
    if storage.exists(path):
        storage.delete(path)
