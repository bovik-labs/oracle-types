FROM debian:stretch-slim
RUN apt-get update
RUN apt-get install -y emacs25
RUN apt-get install -y git
RUN apt-get install -y curl
RUN mkdir -p /usr/share/man/man1/
RUN mkdir -p /usr/share/man/man7/
RUN apt-get install -y postgresql-client-9.6
RUN apt-get install -y make
RUN apt-get install -y z3

SHELL ["/bin/bash", "--login", "-c"]
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
RUN nvm install 15.4.0

RUN mkdir /tapeworm
COPY TypeScript/built/local /tapeworm/TypeScript
COPY get_schema /tapeworm/get_schema
COPY twilio_client /tapeworm/twilio_client
COPY scripts /tapeworm/scripts
COPY magic_demo /tapeworm/magic_demo
RUN cd /tapeworm/magic_demo && npm install -y
COPY scripts/.emacs /root/.emacs
RUN /tapeworm/scripts/init.sh
