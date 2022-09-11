FROM debian:11-slim
ARG DEBIAN_FRONTEND=noninteractive
ARG FFMPEG_VERSION="4.4" 
ENV FFMPEG_VERSION="${FFMPEG_VERSION}"
ENV TZ=Europe/Helsinki
WORKDIR /opt
RUN apt-get update -qq && apt-get -y install \
    autoconf \
    automake \
    build-essential \
    cmake \
    doxygen \
    git \
    graphviz \
    imagemagick \
    libasound2-dev \
    libass-dev \
    libavcodec-dev \
    libavdevice-dev \
    libavfilter-dev \
    libavformat-dev \
    libavutil-dev \
    libfreetype6-dev \
    libgmp-dev \
    libmp3lame-dev \
    libopencore-amrnb-dev \
    libopencore-amrwb-dev \
    libopus-dev \
    librtmp-dev \
    libsdl2-dev \
    libsdl2-image-dev \
    libsdl2-mixer-dev \
    libsdl2-net-dev \
    libsdl2-ttf-dev \
    libsnappy-dev \
    libsoxr-dev \
    libssh-dev \
    libssl-dev \
    libtool \
    libv4l-dev \
    libva-dev \
    libvdpau-dev \
    libvo-amrwbenc-dev \
    libvorbis-dev \
    libwebp-dev \
    libx264-dev \
    libx265-dev \
    libxcb-shape0-dev \
    libxcb-shm0-dev \
    libxcb-xfixes0-dev \
    libxcb1-dev \
    libxml2-dev \
    lzma-dev \
    meson \
    nasm \
    pkg-config \
    python3-dev \
    python3-pip \
    texinfo \
    wget \
    yasm \
    zlib1g-dev \
    libdrm-dev
RUN mkdir ffmpeg-libraries && \
    git clone --depth 1 https://github.com/mstorsjo/fdk-aac.git ffmpeg-libraries/fdk-aac \
    && cd ffmpeg-libraries/fdk-aac \
    && autoreconf -fiv \
    && ./configure \
    && make -j$(nproc) \
    && make install
RUN git clone --depth 1 https://github.com/ultravideo/kvazaar.git ffmpeg-libraries/kvazaar \
    && cd ffmpeg-libraries/kvazaar \
    && ./autogen.sh \
    && ./configure \
    && make -j$(nproc) \
    && make install
RUN git clone --depth 1 https://chromium.googlesource.com/webm/libvpx ffmpeg-libraries/libvpx \
    && cd ffmpeg-libraries/libvpx \
    && ./configure --disable-examples --disable-tools --disable-unit_tests --disable-docs \
    && make -j$(nproc) \
    && make install
RUN git clone -b release-3.0.4 https://github.com/sekrit-twc/zimg.git ffmpeg-libraries/zimg \
    && cd ffmpeg-libraries/zimg \
    && sh autogen.sh \
    && ./configure \
    && make -j$(nproc) \
    && make install
RUN ldconfig
RUN git clone --branch release/5.0 --depth 1 https://github.com/FFmpeg/FFmpeg.git FFmpeg \
    && cd FFmpeg \
    && ./configure \
        --extra-cflags="-I/usr/local/include" \
        --extra-ldflags="-L/usr/local/lib" \
        --extra-libs="-lpthread -lm -latomic" \
        --arch=arm64 \
        --enable-gmp \
        --enable-gpl \
        --enable-libass \
        --enable-libdrm \
        --enable-libfdk-aac \
        --enable-libfreetype \
        --enable-libkvazaar \
        --enable-libmp3lame \
        --enable-libopencore-amrnb \
        --enable-libopencore-amrwb \
        --enable-libopus \
        --enable-librtmp \
        --enable-libsnappy \
        --enable-libsoxr \
        --enable-libssh \
        --enable-libvorbis \
        --enable-libvpx \
        --enable-libzimg \
        --enable-libwebp \
        --enable-libx264 \
        --enable-libx265 \
        --enable-libxml2 \
        --enable-nonfree \
        --enable-version3 \
        --target-os=linux \
        --enable-pthreads \
        --enable-openssl \
        --enable-hardcoded-tables \
    && make -j$(nproc) \
    && make install
RUN apt-get -y update && \
    apt install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_16.x | bash && \
    apt install -y nodejs
RUN apt-get -y update && \
    apt-get install -y bash python3 python3-pip git && \
    apt-get -y update && \
    apt-get clean all
RUN python3 -m pip install --upgrade git+https://github.com/yt-dlp/yt-dlp.git@release
WORKDIR /workspace
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY index.js index.js
RUN npm ci
CMD ["node", "index.js"]
