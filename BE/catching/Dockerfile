FROM azul/zulu-openjdk:17.0.14-17.56
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    tesseract-ocr \
    tesseract-ocr-kor \
    tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

ENV TESSDATA_PREFIX=/usr/share/tesseract-ocr/4.00/tessdata

ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+UseContainerSupport -Xms2g -Xmx3g"

EXPOSE 8092
RUN chown -R 1001:1001 /app
USER 1001

ARG JAR_FILE
COPY ${JAR_FILE} app.jar

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8092/actuator/health || exit 1

CMD java $JAVA_OPTS -jar app.jar