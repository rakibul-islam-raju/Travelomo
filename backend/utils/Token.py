import random
import string
import hashlib


"""
    Token class
    This class is used to generate and verify tokens
    It is a singleton class
"""


class Token:
    @staticmethod
    def generate_token(length=100) -> str:
        token = "".join(random.choices(string.ascii_letters + string.digits, k=length))
        return token

    @staticmethod
    def hash_token(token) -> str:
        return hashlib.sha256(token.encode()).hexdigest()

    @staticmethod
    def verify_token(raw_token, hashed_token) -> bool:
        return Token.hash_token(raw_token) == hashed_token

    @staticmethod
    def generate_and_hash_token(length=100) -> dict:
        token = Token.generate_token(length)
        return {"token": token, "hash": Token.hash_token(token)}
