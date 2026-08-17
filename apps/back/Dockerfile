FROM python:3.13-alpine

WORKDIR /app
COPY apps/back/main.py ./main.py

ENV BACK_PORT=3000
EXPOSE 3000

CMD ["python3", "main.py"]
