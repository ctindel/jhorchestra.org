FROM ubuntu:24.04

ARG TARGETPLATFORM

ENV SHELL /bin/bash
ENV GOPATH=/root/go

USER root

RUN apt-get -y update && \
    mkdir -p /tmp/jho && \
    apt-get install -y lsb-release sudo vim curl wget git libc6

RUN echo "Targetplatform is ${TARGETPLATFORM}"

RUN cd /tmp/jho && \
    wget https://github.com/gohugoio/hugo/releases/download/v0.154.5/hugo_extended_0.154.5_linux-arm64.tar.gz && \
    tar -xf hugo_extended_0.154.5_linux-arm64.tar.gz hugo && \
    mv hugo /usr/bin/hugo && \
    rm -rf hugo_extended_0.154.5_linux-arm64.tar.gz && \
    echo "#!/bin/bash\ncd /mnt/jho; /usr/bin/hugo server -w --bind 0.0.0.0 -b http://localhost:8080/ --disableFastRender --appendPort=false" > /tmp/jho/run_local.sh && \
    chmod 755 /tmp/jho/run_local.sh && \
    echo "#!/bin/bash\necho \"Run 'docker exec -it jho_shell /bin/bash'\"\n echo \"Press [CTRL+C] to stop..\"\nwhile true\ndo\n   sleep 1\ndone" > /tmp/jho/run_shell.sh && \
    chmod 755 /tmp/jho/run_shell.sh && \
    echo "#!/bin/bash\ncd /mnt/jho; /usr/bin/hugo && /usr/bin/hugo deploy\n" > /tmp/jho/deploy.sh && \
    chmod 755 /tmp/jho/deploy.sh

CMD ["/bin/bash"]
ENTRYPOINT ["/bin/bash", "-c"]
