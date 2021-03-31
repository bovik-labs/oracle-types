#!/bin/bash

echo "Initializing database demo..."

# save from having to type password
echo "database:5432:postgres:postgres:glorpglop" > ~/.pgpass
chmod 0600 ~/.pgpass

PSQL="psql -h database -U postgres"

# convenience alias so `psql` at the commandline has the right arguments
echo "alias psql=\"${PSQL}\"" >> ~/.bashrc

emacs --script /tapeworm/scripts/setup-emacs.el
