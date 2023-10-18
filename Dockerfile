FROM debian:12-slim
ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Helsinki

RUN apt-get update && \
    apt-get install -y ca-certificates curl gnupg && \
     mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | \ 
    tee /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && apt-get install nodejs -y

RUN apt-get -y update && \
    apt-get install -y ffmpeg bash python3 python3-pip git &&\
    apt-get -y update && \
    apt-get clean all
WORKDIR /workspace
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY index.js index.js
RUN npm ci
ARG BUILD_NUMBER
LABEL build-number="${BUILD_NUMBER}"
RUN python3 -m pip install --upgrade --no-cache-dir --break-system-packages git+https://github.com/yt-dlp/yt-dlp.git@master
CMD ["node", "index.js"]