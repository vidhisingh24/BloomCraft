from concurrent.futures import ThreadPoolExecutor

import pytest

from app.auth.password.policy import PasswordCheck, check_password, context_words

EMAIL = "owner@example.test"
NAME = "Owner Singh"


def check(password: str, **context: object) -> PasswordCheck:
    kwargs: dict[str, object] = {"email": EMAIL, "full_name": NAME, **context}
    return check_password(password, min_length=15, max_length=128, **kwargs)  # type: ignore[arg-type]


def test_length_bounds_in_code_points() -> None:
    fifteen = "tulip v8 meadow"
    assert len(fifteen) == 15
    assert check_password(fifteen, min_length=15, max_length=128).ok
    result = check_password(fifteen[:-1], min_length=15, max_length=128)
    assert (result.reason, result.message) == ("too_short", "Use at least 15 characters.")
    long_ok = ("zebra lantern quartz meadow " * 5)[:128]
    assert check_password(long_ok, min_length=15, max_length=128).ok
    too_long = long_ok + "x"
    result = check_password(too_long, min_length=15, max_length=128)
    assert (result.reason, result.message) == ("too_long", "Use at most 128 characters.")


def test_length_counts_nfc_code_points() -> None:
    decomposed = "cafe" + chr(0x301) + " tulip mead"  # 16 code points, 15 after NFC
    assert len(decomposed) == 16
    assert check_password(decomposed, min_length=16, max_length=128).reason == "too_short"
    assert check_password(decomposed, min_length=15, max_length=128).reason != "too_short"


@pytest.mark.parametrize(
    "password",
    [
        "valid words here" + chr(0xD800) + "x",  # lone surrogate
        "valid words\x00here tulip",
        "valid\twords here tulip",
    ],
)
def test_invalid_characters(password: str) -> None:
    result = check(password)
    assert result.reason == "invalid_characters"
    assert result.message == "The password contains characters that can't be used."


REJECTED = [
    "bloomcraft2026!!!",
    "passwordpassword",
    "Qwertyuiop123456",
    "123456789012345",
    "sunflower sunflower",
    "Owner Singh 12345",
    "owner.singh.1234",
    "i love you so much",
    # variants built from the email local part and the name
    "owner@example.test!",
    "ownerownerowner1",
    "Singh Singh Singh",
    "example.test.2026",
]
ACCEPTED = [
    "vadodara tulip garden",
    "pink tulip keychain",
    "correct horse battery staple",
    "MyDogIsNamedBruno",
    "maker studio vadodara 7",
]


@pytest.mark.parametrize("password", REJECTED)
def test_blocklist_rejects(password: str) -> None:
    result = check(password)
    assert result.reason == "too_common"
    assert result.message == (
        "This password is too easy to guess. Try a longer passphrase of unrelated words."
    )


@pytest.mark.parametrize("password", ACCEPTED)
def test_blocklist_accepts(password: str) -> None:
    assert check(password) == PasswordCheck(ok=True)


def test_full_width_spelling_of_a_common_password_is_caught() -> None:
    full_width = "".join(chr(ord(c) + 0xFEE0) for c in "passwordpassword")
    assert check(full_width).reason == "too_common"


def test_shop_name_counts_as_context() -> None:
    assert check("Knotty Marigold Shop").ok
    assert check("Knotty Marigold Shop", extra_words=["Knotty Marigold"]).reason == ("too_common")


def test_separator_rule() -> None:
    """zxcvbn prices separators as random characters; the joined form is scored too."""
    assert check("Owner Singh 12345").reason == "too_common"
    assert check_password("Owner Singh 12345", min_length=15, max_length=128).reason == (
        "too_common"
    )


def test_messages_never_contain_the_password() -> None:
    for password in [*REJECTED, "short", "x" * 200, "bad\x00char tulip garden"]:
        result = check(password)
        assert result.message is not None
        assert password not in result.message


def test_context_words() -> None:
    words = context_words(
        email=" Owner@Example.TEST ", full_name="Owner  Singh", extra_words=["My Shop"]
    )
    for expected in ("bloomcraft", "owner@example.test", "owner", "example", "ownersingh", "singh"):
        assert expected in words
    assert "my shop" in words
    assert "myshop" in words
    assert context_words(email=None, full_name=None) == [
        "bloomcraft",
        "bloom craft",
        "bloom",
        "craft",
    ]
    assert context_words(email="   ", full_name=None) == context_words(email=None, full_name=None)


def test_thread_safety() -> None:
    """zxcvbn keeps user inputs in a module-level dict: concurrent calls must not mix them."""
    cases = [
        ("ownerownerowner1", "owner@example.test", "Owner Singh"),
        ("ownerownerowner1", "zed@example.test", "Zed Ali"),
        ("zedzedzedzedzed1", "zed@example.test", "Zed Ali"),
        ("zedzedzedzedzed1", "owner@example.test", "Owner Singh"),
        ("pink tulip keychain", "owner@example.test", "Owner Singh"),
        ("singhsinghsingh1", "owner@example.test", "Owner Singh"),
        ("singhsinghsingh1", "zed@example.test", "Zed Ali"),
        ("vadodara tulip garden", "zed@example.test", "Zed Ali"),
    ]

    def run(case: tuple[str, str, str]) -> PasswordCheck:
        password, email, name = case
        return check_password(password, min_length=15, max_length=128, email=email, full_name=name)

    sequential = [run(case) for case in cases] * 10
    with ThreadPoolExecutor(max_workers=8) as pool:
        parallel = list(pool.map(run, cases * 10))
    assert parallel == sequential
