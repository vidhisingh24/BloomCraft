import uuid

import pytest

from app.auth.models import User, VerificationChallenge
from app.crypto.blind_index import blind_index
from app.crypto.field_encryption import DecryptionError, decrypt_text, key_id_of
from app.db.registry import ENCRYPTED_COLUMNS
from app.modules.accounts.models import Address
from app.modules.checkout.models import IdempotencyRecord
from app.modules.sellers.models import SellerProfile

# Every 🔒 column of PLAN §1.7, plus idempotency_records.response_body.
EXPECTED_ENCRYPTED = {
    ("addresses", "address", "json"),
    ("addresses", "phone", "text"),
    ("addresses", "recipient_name", "text"),
    ("admin_invitations", "email", "text"),
    ("custom_requests", "contact", "json"),
    ("idempotency_records", "response_body", "json"),
    ("legacy_customers", "email", "text"),
    ("legacy_customers", "notes", "text"),
    ("legacy_customers", "phone", "text"),
    ("notifications", "destination", "text"),
    ("notifications", "payload", "json"),
    ("oauth_identities", "email_at_link", "text"),
    ("oauth_transactions", "code_verifier", "text"),
    ("orders", "contact_email", "text"),
    ("orders", "contact_name", "text"),
    ("orders", "contact_phone", "text"),
    ("orders", "delivery_details", "json"),
    ("orders", "gift_message", "text"),
    ("orders", "upi_txn_ref", "text"),
    ("pending_signups", "profile", "json"),
    ("seller_profiles", "contact_whatsapp", "text"),
    ("users", "email", "text"),
    ("users", "mfa_totp_secret", "text"),
    ("users", "phone", "text"),
    ("verification_challenges", "target", "text"),
}


def test_registry_matches_expected_list() -> None:
    assert {(c.table, c.column, c.kind) for c in ENCRYPTED_COLUMNS} == EXPECTED_ENCRYPTED
    pk = {c.qualified: c.pk_column for c in ENCRYPTED_COLUMNS}
    assert pk["seller_profiles.contact_whatsapp"] == "user_id"
    assert {v for k, v in pk.items() if k != "seller_profiles.contact_whatsapp"} == {"id"}
    assert all(c.sa_table.name == c.table for c in ENCRYPTED_COLUMNS)


def test_id_assigned_on_first_set_and_aad_uses_it() -> None:
    user = User(full_name="Asha")
    assert user.id is None
    user.email = " Asha@Example.COM "
    assert isinstance(user.id, uuid.UUID)
    assert user.email == "asha@example.com"  # stored normalised
    assert user.email_ct is not None
    assert decrypt_text(user.email_ct, table="users", column="email", row_id=user.id) == (
        "asha@example.com"
    )
    assert key_id_of(user.email_ct) == "k1"


def test_blind_index_set_and_cleared_together() -> None:
    user = User(full_name="Asha")
    user.phone = "098765 43210"
    assert user.phone == "+919876543210"
    assert user.phone_bidx == blind_index("phone", "+91 98765 43210")
    user.phone = None
    assert user.phone is None
    assert user.phone_ct is None
    assert user.phone_bidx is None


def test_existing_id_is_kept() -> None:
    row_id = uuid.uuid7()
    user = User(id=row_id, full_name="Asha")
    user.email = "a@example.com"
    assert user.id == row_id


def test_moving_ciphertext_between_rows_fails() -> None:
    a, b = User(full_name="A"), User(full_name="B")
    a.email = "a@example.com"
    b.email = "b@example.com"
    b.email_ct = a.email_ct
    with pytest.raises(DecryptionError):
        _ = b.email


def test_changing_id_after_encryption_breaks_decryption() -> None:
    user = User(full_name="A")
    user.email = "a@example.com"
    user.id = uuid.uuid7()
    with pytest.raises(DecryptionError):
        _ = user.email


def test_primary_key_other_than_id_must_be_set_first() -> None:
    profile = SellerProfile(shop_name="Shop", slug="shop")
    with pytest.raises(ValueError, match=r"seller_profiles\.user_id must be set"):
        profile.contact_whatsapp = "+91 98765 43210"
    profile.user_id = uuid.uuid7()
    profile.contact_whatsapp = "+91 98765 43210"
    assert profile.contact_whatsapp == "+91 98765 43210"


def test_json_field_reassign() -> None:
    address = Address(user_id=uuid.uuid7(), city="Vadodara", state="Gujarat", pincode="390001")
    address.address = {"house": "12", "street": "Alkapuri"}
    value = address.address
    value["house"] = "99"  # in-place mutation is not written back
    assert address.address == {"house": "12", "street": "Alkapuri"}
    address.address = {**address.address, "house": "99"}
    assert address.address["house"] == "99"
    with pytest.raises(TypeError):
        address.address = "not json object"
    record = IdempotencyRecord()
    record.response_body = [1, {"a": None}]
    assert record.response_body == [1, {"a": None}]


def test_text_field_rejects_non_strings() -> None:
    with pytest.raises(TypeError):
        User(full_name="x").mfa_totp_secret = 123


def test_challenge_target_kind_follows_purpose() -> None:
    phone = VerificationChallenge(purpose="phone_verify")
    phone.target = "+91 98765 43210"
    assert phone.target_bidx == blind_index("phone", "9876543210")
    email = VerificationChallenge(purpose="register_email")
    email.target = "New@Example.com"
    assert email.target == "new@example.com"
    assert email.target_bidx == blind_index("email", "new@example.com")
    with pytest.raises(ValueError, match="purpose must be set"):
        VerificationChallenge().target = "x@example.com"


def test_repr_hides_values() -> None:
    user = User(full_name="Asha Plaintext")
    user.email = "hidden@example.com"
    text = repr(user)
    assert "hidden" not in text
    assert "Asha" not in text
    assert repr(user.email_ct) not in text
    assert text.startswith("<User")


def test_descriptor_class_access() -> None:
    field = User.email
    assert field.ciphertext_attr == "email_ct"
    assert field.binding(User).table == "users"
