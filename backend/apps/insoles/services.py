from django.utils import timezone

from .models import InsoleOrder, InsoleStatusHistory


def transition_status(order: InsoleOrder, new_status: str, user, comment: str = "") -> InsoleOrder:
    """Moves an insole order to a new Kanban status and logs the change."""
    order.status = new_status
    if new_status == InsoleOrder.Status.LIVRE:
        order.delivered_at = timezone.now()
    order.save()

    InsoleStatusHistory.objects.create(
        insole_order=order,
        status=new_status,
        changed_by=user,
        comment=comment,
    )
    return order
