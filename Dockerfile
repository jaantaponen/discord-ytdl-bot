FROM debian:11-slim
ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Helsinki
RUN apt-get -y update && \
    apt install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_16.x | bash && \
    apt install -y nodejs
RUN apt-get -y update && \
    apt-get install -y ffmpeg bash python3 python3-pip git &&\
    apt-get -y update && \
    apt-get clean all
WORKDIR /workspace
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY index.js index.js
RUN npm ci
RUN python3 -m pip install --upgrade --no-cache-dir git+https://github.com/yt-dlp/yt-dlp.git@master
CMD ["node", "index.js"]