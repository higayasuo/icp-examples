FROM mcr.microsoft.com/devcontainers/typescript-node:0-18

RUN sudo apt update
RUN sudo apt install -y cmake

WORKDIR /app

RUN chown -R node:node /app

USER node

RUN echo "export PROMPT_DIRTRIM=2" >> ~/.bashrc
RUN echo 'export PS1="\w$ "' >> ~/.bashrc

RUN echo "set editing-mode emacs" >> ~/.inputrc
RUN echo "set completion-ignore-case off" >> ~/.inputrc
RUN echo "set show-all-if-unmodified on" >> ~/.inputrc
RUN echo '"\\C-p": history-search-backward' >> ~/.inputrc
RUN echo '"\\C-n": history-search-forward' >> ~/.inputrc
RUN echo '"\\e[A": history-search-backward' >> ~/.inputrc
RUN echo '"\\e[B": history-search-forward' >> ~/.inputrc

RUN sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y
RUN ~/.cargo/bin/rustup target add wasm32-unknown-unknown
RUN ~/.cargo/bin/cargo install candid-extractor
RUN ~/.cargo/bin/cargo install ic-wasm