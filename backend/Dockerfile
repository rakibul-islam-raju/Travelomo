FROM python:3.12-bullseye

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app
COPY . /app/
RUN pip install -r requirements.txt


# Expose the port the app runs on
# EXPOSE 8000

# Run app.py when the container launches
# CMD ["gunicorn", "--bind", "0.0.0.0:8000", "gnf.wsgi:application"]
