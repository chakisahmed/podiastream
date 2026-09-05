from django.db.models.signals import post_delete
from django.dispatch import receiver

from apps.documents.models import Document
from apps.insoles.models import InsoleAttachment

from . import storage


@receiver(post_delete, sender=Document)
def delete_document_file(sender, instance, **kwargs):
    storage.delete_file(sender.BUCKET, instance.storage_path)


@receiver(post_delete, sender=InsoleAttachment)
def delete_insole_attachment_file(sender, instance, **kwargs):
    storage.delete_file(sender.BUCKET, instance.storage_path)
