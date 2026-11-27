"""Delivery inference should not mistake ordinary reports for repositories."""

from app.models.delivery import DeliveryMode
from app.models.job import Job
from app.services.quote_service import infer_delivery_mode


def test_report_uses_document_delivery():
    assert (
        infer_delivery_mode(Job(raw_description="Write a report on market trends"), {})
        == DeliveryMode.document
    )


def test_payment_service_uses_persisted_statuses():
    from app.models.payment import PaymentStatus
    from app.services import payment_service

    assert set(payment_service._VALID_TRANSITIONS) == set(PaymentStatus)
