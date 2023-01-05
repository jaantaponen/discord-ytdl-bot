FROM nvidia/cuda:11.0.3-devel-ubuntu20.04 as build
RUN apt-get update --fix-missing \
    && apt-get -y upgrade \
    && apt-get -y dist-upgrade
ARG FFMPEG_VERSION="4.4" 
ENV FFMPEG_VERSION="${FFMPEG_VERSION}"
ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Helsinki
# Install dependencies https://github.com/xychelsea/ffmpeg-docker/blob/main/Dockerfile
RUN apt-get -y install \
    cleancss \
    doxygen \
    debhelper-compat \
    flite1-dev \
    frei0r-plugins-dev \
    ladspa-sdk libaom-dev \
    libaribb24-dev \
    libass-dev \
    libbluray-dev \
    libbs2b-dev \
    libbz2-dev \
    libcaca-dev \
    libcdio-paranoia-dev \
    libchromaprint-dev \
    libcodec2-dev \
    libdc1394-22-dev \
    libdrm-dev \
    libfdk-aac-dev \
    libffmpeg-nvenc-dev \
    libfontconfig1-dev \
    libfreetype6-dev \
    libfribidi-dev \
    libgl1-mesa-dev \
    libgme-dev \
    libgnutls28-dev \
    libgsm1-dev \
    libiec61883-dev \
    libavc1394-dev \
    libjack-jackd2-dev \
    liblensfun-dev \
    liblilv-dev \
    liblzma-dev \
    libmp3lame-dev \
    libmysofa-dev \
    libnvidia-compute-470-server \
    libnvidia-decode-470-server \
    libnvidia-encode-470-server \
    libopenal-dev \
    libomxil-bellagio-dev \
    libopencore-amrnb-dev \
    libopencore-amrwb-dev \
    libopenjp2-7-dev \
    libopenmpt-dev \
    libopus-dev \
    libpulse-dev \
    librubberband-dev \
    librsvg2-dev \
    libsctp-dev \
    libsdl2-dev \
    libshine-dev \
    libsnappy-dev \
    libsoxr-dev \
    libspeex-dev \
    libssh-gcrypt-dev \
    libtesseract-dev \
    libtheora-dev \
    libtwolame-dev \
    libva-dev \
    libvdpau-dev \
    libvidstab-dev \
    libvo-amrwbenc-dev \
    libvorbis-dev \
    libvpx-dev \
    libwavpack-dev \
    libwebp-dev \
    libx264-dev \
    libx265-dev \
    libxcb-shape0-dev \
    libxcb-shm0-dev \
    libxcb-xfixes0-dev \
    libxml2-dev \
    libxv-dev \
    libxvidcore-dev \
    libxvmc-dev \
    libzmq3-dev \
    libzvbi-dev \
    nasm \
    node-less \
    ocl-icd-opencl-dev \
    pkg-config \
    texinfo \
    tree \
    wget \
    zlib1g-dev
RUN wget -O ffmpeg.tar.gz https://ffmpeg.org/releases/ffmpeg-${FFMPEG_VERSION}.tar.gz \
    && mkdir ffmpeg && tar -xvf ffmpeg.tar.gz -C ffmpeg --strip-components 1 \
    && cd ffmpeg \
    && ./configure \
        --prefix=/usr/local/ffmpeg-nvidia \
        --extra-cflags=-I/usr/local/cuda/include \
        --extra-ldflags=-L/usr/local/cuda/lib64 \
        --toolchain=hardened \
        --enable-gpl \
        --disable-stripping \
        --enable-avresample --disable-filter=resample \
        --enable-cuvid \
        --enable-gnutls \
        --enable-ladspa \
        --enable-libaom \
        --enable-libass \
        --enable-libbluray \
        --enable-libbs2b \
        --enable-libcaca \
        --enable-libcdio \
        --enable-libcodec2 \
        --enable-libfdk-aac \
        --enable-libflite \
        --enable-libfontconfig \
        --enable-libfreetype \
        --enable-libfribidi \
        --enable-libgme \
        --enable-libgsm \
        --enable-libjack \
        --enable-libmp3lame \
        --enable-libmysofa \
        --enable-libnpp \
        --enable-libopenjpeg \
        --enable-libopenmpt \
        --enable-libopus \
        --enable-libpulse \
        --enable-librsvg \
        --enable-librubberband \
        --enable-libshine \
        --enable-libsnappy \
        --enable-libsoxr \
        --enable-libspeex \
        --enable-libssh \
        --enable-libtheora \
        --enable-libtwolame \
        --enable-libvorbis \
        --enable-libvidstab \
        --enable-libvpx \
        --enable-libwebp \
        --enable-libx265 \
        --enable-libxml2 \
        --enable-libxvid \
        --enable-libzmq \
        --enable-libzvbi \
        --enable-lv2 \
        --enable-nvenc \
        --enable-nonfree \
        --enable-omx \
        --enable-openal \
        --enable-opencl \
        --enable-opengl \
        --enable-sdl2 \
    && make -j$(nproc)
RUN cd ffmpeg && make -j$(nproc) install 
WORKDIR /src
RUN tar -cvf /src/ffmpeg-dynamic-deps.tar \
    $(ldd /usr/local/ffmpeg-nvidia/bin/ffmpeg | \
      grep / | \
      awk '{ print $3 }' | \
      xargs readlink -f)
#
#
#
FROM nvidia/cuda:11.0.3-devel-ubuntu20.04
ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Helsinki
COPY --from=build /usr/local/ffmpeg-nvidia/lib/* /usr/local/lib/
COPY --from=build /usr/local/ffmpeg-nvidia/bin/* /usr/local/bin/
COPY --from=build /src/ffmpeg-dynamic-deps.tar /
RUN tar -xvf /ffmpeg-dynamic-deps.tar && \ 
    rm /ffmpeg-dynamic-deps.tar
ENV NVIDIA_VISIBLE_DEVICES all
ENV NVIDIA_DRIVER_CAPABILITIES video,compute,utility
RUN apt-get -y update && \
    apt install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_16.x | bash && \
    apt install -y nodejs
RUN apt-get -y update && \
    apt-get install -y bash python3 python3-pip git &&\
    apt-get -y update && \
    apt-get clean all
WORKDIR /workspace
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm ci
RUN python3 -m pip install --upgrade git+https://github.com/yt-dlp/yt-dlp.git@release
COPY index.js index.js
CMD ["node", "index.js"]
