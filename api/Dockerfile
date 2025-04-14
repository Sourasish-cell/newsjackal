FROM python:3.9-slim-buster
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
ENV FLASK_APP=api.py
EXPOSE 5000
CMD ["gunicorn", "--bind", "0.0.0.0:${PORT:-5000}", "api:app"]
