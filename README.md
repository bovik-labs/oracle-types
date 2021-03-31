Oracle Types
============

Oracle types are a proposed feature to the typescript compiler that
allows programmer-defined extensions to the type system.

Read more about them in [our paper](paper/oracle-types.pdf) to appear
in [SIGBOVIK'21](http://sigbovik.org/2021/), or watch
the [presentation](https://www.youtube.com/watch?v=ADPpyFnD-ac).

To set up the demo environment (requires `docker` and
`docker-compose`) do

```
$ make docker-build-up # this may take a minute
$ make demo-emacs # starts emacs in docker container
```

This will open up a copy of emacs inside the docker container, viewing
a typescript file. At present, it should have no type errors. If it
does, it may be just because the database hasn't come up yet --- try
waiting a couple seconds, make a trivial change, and resaving.

To run the `orm-demo.ts` script, cd in the container to `/tapeworm/magic_demo` and run
```
make run
```

TODO: make the emacs initialization script wait for the database to be
fully up.

To edit the database schema live, we can do
```
$ make demo-ssh # ssh into same container as running emacs
# psql # connect to database
> ALTER TABLE users ADD COLUMN frequent_flyer_miles integer; -- create new column
```

Now the ORM should deliver another accessor `frequent_flyer_miles` in
tab-completion in the `Users` model object.

When developing sans emacs:

```
make docker-build-up
make docker-ssh
node ../TypeScript/tsc.js <path>
```

For all docker commands in the makefile, set the environment variable
`VOLUMES=1` if you want to include the volume declarations in
`docker-compose-volumes.yml`.

Twilio Demo
-----------

To get the SMS parts of the "mobile-first interactive typechecking"
demo working, replace the invocation of `docker-build-up` above with

    export TWILIO_JSON=/path/to/some/file/like/twilio.json
    make docker-build-up

`twilio.json` should look like

```
{
"TWILIO_ACCOUNT_ID":"...",
"TWILIO_PHONE_NUMBER_SRC":"+15554443333",
"TWILIO_PHONE_NUMBER_DST":"+15554443333",
"TWILIO_RELAY_SERVER":"host:port",
"TWILIO_AUTH_TOKEN":"..."
}
```

Project Structure
-----------------

- `Makefile`: some convenience commands for `docker-compose` lifecycle management

- `get_schema/`: A nodejs script that a type-level shell can call to
  get schema information out of.  Presently, it takes two arguments,
  `database` (the host for pg to connect to) and the `table` name,
  and returns a little bit of JSON that describes the table's
  columns.

  Also includes a file `schema.ts` that `magic_demo/orm.ts` uses as a
  library.

  The important thing distinction I'm trying to maintain between this
  directory and `magic_demo/` is that we should be able to
  conveniently compile everything in `get_schema/` on the host,
  without needing a special copy of `tsc`.

- `magic_demo/`: Some demos meant to be run inside docker to show
  off the applications of oracle types.

- `scripts/`: some configuration scripts used by the docker environment

- `TypeScript/`: the typescript compiler checked out at a branch that includes
  the "advanced type-level computation feature".
