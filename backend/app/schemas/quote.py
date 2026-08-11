"""Request schemas for the quote and expert-offer endpoints.

Quote *responses* are assembled as plain dicts (matching the existing
``/jobs/{id}/plan`` style) because they carry a nested, engine-shaped breakdown
that is more useful to the client verbatim than flattened through a model.
"""

from pydantic import BaseModel, Field


class QuoteRejectRequest(BaseModel):
    """Why the client declined the price. Feeds pricing calibration."""

    reason: str = Field(
        default="",
        max_length=2000,
        description="Optional explanation shown to the pricing team",
    )


class OfferAcceptRequest(BaseModel):
    """A human expert accepting a price inside the quoted range."""

    price: float = Field(
        ...,
        ge=0,
        description=(
            "Asking price. Must fall inside the range TaskMatch quoted for this "
            "task — experts accept an arbitrated band, they do not bid freely."
        ),
    )
