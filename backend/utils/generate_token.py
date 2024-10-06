import random
import string


def generate_token(length=100):
    token = "".join(random.choices(string.ascii_letters + string.digits, k=length))

    return token
