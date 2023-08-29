FROM ubuntu:20.04

ARG TARGETPLATFORM

ENV SHELL /bin/bash
ENV GOPATH=/root/go

USER root

RUN apt-get -y update && \
    mkdir -p /tmp/jho && \
    apt-get install -y lsb-release sudo vim curl git make build-essential

RUN echo "Targetplatform is ${TARGETPLATFORM}"

RUN if [ "$TARGETPLATFORM" = "linux/amd64" ]; then ARCHITECTURE=linux-amd64; elif [ "$TARGETPLATFORM" = "linux/arm64" ]; then ARCHITECTURE=linux-arm64; else exit 1; fi && \
 curl https://storage.googleapis.com/golang/go1.19.5.${ARCHITECTURE}.tar.gz -o /tmp/jho/go.${ARCHITECTURE}.tar.gz && \
    tar zxpvf /tmp/jho/go.${ARCHITECTURE}.tar.gz -C /usr/local

RUN cd /tmp/jho && \
    git clone https://github.com/gohugoio/hugo.git && \
    cd hugo && \
    /usr/local/go/bin/go install --tags extended && \
    echo "#!/bin/bash\ncd /mnt/jho; /root/go/bin/hugo server -w --bind 0.0.0.0 -b http://localhost:8080/ --disableFastRender --appendPort=false" > /tmp/jho/run_local.sh && \
    chmod 755 /tmp/jho/run_local.sh && \
    echo "#!/bin/bash\necho \"Run 'docker exec -it jho_shell /bin/bash'\"\n echo \"Press [CTRL+C] to stop..\"\nwhile true\ndo\n   sleep 1\ndone" > /tmp/jho/run_shell.sh && \
    chmod 755 /tmp/jho/run_shell.sh && \
    echo "#!/bin/bash\ncd /mnt/jho; /root/go/bin/hugo && /root/go/bin/hugo deploy\n" > /tmp/jho/deploy.sh && \
    chmod 755 /tmp/jho/deploy.sh

CMD ["/bin/bash"]
ENTRYPOINT ["/bin/bash", "-c"]
