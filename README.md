# node-cassandra-cql

node-cassandra-cql is a [Node.js](http://nodejs.org) CQL driver for [Apache Cassandra CQL3 binary protocol](https://git-wip-us.apache.org/repos/asf?p=cassandra.git;a=blob_plain;f=doc/native_protocol.spec;hb=refs/heads/cassandra-1.2).

CQL is a query language for [Apache Cassandra](http://cassandra.apache.org).


## Installation

    $ npm install node-cassandra-cql

## Features
- Connection pooling to multiple hosts
- Parameters in queries (even for sets/lists/maps collections)
- Plain Old Javascript: no need to generate thrift files
- Get cell by column name: `row.get('first_name')`
- Bigints support (using [node-int64](https://github.com/broofa/node-int64))

## Using it
```javascript
// Creating a new connection pool to multiple hosts.
var Client = require('node-cassandra-cql').Client;
var hosts = ['host1:9042', 'host2:9042', 'host3', 'host4'];
var cqlClient = new Client({hosts: hosts, keyspace: 'Keyspace1'});
```
Client() accepts an object with these slots, only `hosts` is required:
```
                hosts: String list in host:port format. Port is optional (defaults to 9042).
             keyspace: Name of keyspace to use.
             username: User for authentication.
             password: Password for authentication.
              version: Currently only '3.0.0' is supported.
            staleTime: Time in milliseconds before trying to reconnect.
    maxExecuteRetries: Maximum amount of times an execute can be retried
                       using another connection, in case the server is unhealthy.
getAConnectionTimeout: Maximum time in milliseconds to wait for a connection from the pool.
```
Queries are performed using the `execute()` method. For example:
```javascript
// Reading
cqlClient.execute('SELECT key, email, last_name FROM user_profiles WHERE key=?', ['jbay'],
  function(err, result) {
    if (err) console.log('execute failed');
    else console.log('got user profile with email ' + result.rows[0].get('email'));
  }
);

// Writing
cqlClient.execute('UPDATE user_profiles SET email=? WHERE key=?', ['my@email.com', 'jbay'], 
  types.consistencies.quorum,
  function(err) {
    if (err) console.log("failure");
    else console.log("success");
  }
);
```
`execute()` accepts the following arguments

        cqlQuery : The cql query to execute, with ? as parameters
        arguments: Array of arguments that will replace the ? placeholders, can be null.
     consistency : The level of consistency.
        callback : The callback function with 2 arguments: err and result

When you are finished with a `Client` instance, call `shutdown(callback)`.
Shutting down the pool prevents further work from being enqueued, and closes all
open connections after pending requests are complete.

```javascript
// Shutting down a pool
cqlClient.shutdown(function() { console.log("connection pool shutdown"); });
```

### Connections
The `Client` maintains a pool of opened connections to the hosts to avoid several time-consuming steps that are involed with the set up of a CQL binary protocol connection (socket connection, startup message, authentication, ...).

If you want to get lower level fine-grained control you could use the `Connection` class.
```javascript
var Connection = require('node-cassandra-cql').Connection;
var con = new Connection({host:'host1', port:9042, username:'cassandra', password:'cassandra'});
con.open(function(err) {
  if(err) {
    console.error(err);
  }
  else {
    var query = 'SELECT key, email, last_name FROM user_profiles WHERE key=?';
    con.execute(query, ['jbay'], function(err, result){
      if (err) console.log('execute failed');
      else console.log('got user profile with email ' + result.rows[0].get('email'));
      con.close();
    });
  }
});
```

### Logging

Instances of `Client()` and `Connection()` are `EventEmitter`'s and emit `log` events:
```javascript
var Connection = require('node-cassandra-cql').Connection;
var con = new Connection({host:'host1', port:9042, keyspace:'Keyspace1'});
con.on('log', function(level, message) {
  console.log('log event: %s -- %j', level, message);
});
```
The `level` being passed to the listener can be `info` or `error`.

### Data types

Cassandra's bigint data types are parsed as [int64](https://github.com/broofa/node-int64).

Lists collections are encoded from / decoded to Javascript Arrays.

Set collections are encoded from / decoded to Objects with 0-indexed, numeric, sequential keys

Map collections are encoded from / decoded to Javascript objects with keys as props.

UUID Strings are detected and treated as UUID objects

Decimal and timeuuid are not parsed yet, they are yielded as byte Buffers.

### Collections and UUIDs

This library makes some assumptions about your data structures and their relationships to C*.
```javascript
// Sets are Objects with 0-indexed, numeric, sequential keys
var iAmASet = {0: "roomba", 1: "cats", 2:"dogs", 3:"snakes", 4:"rats"};
// Lists are just arrays
var iAmAList = ["cats", "dogs", "snakes", "rats"];
// Maps are simple key/value pairs as you would expect
var iAmAMap = {"pet": "cat", "food": "yep", "water": "that too"};
```

UUIDs are detected and not quoted so 
`INSERT INTO sections (section_uuid, section_settings) VALUES (?, ?)` with values of `["43d2891f-6041-4572-bcdd-0bb14b96aa5f", {name: "Sports Section", status: "open", updateCount: 4}]`
generates CQL that looks like:

    INSERT INTO sections (section_uuid, section_settings) VALUES 
    (  43d2891f-6041-4572-bcdd-0bb14b96aa5f,
       {'name': 'Sports Section', 'status': 'open', 'updateCount': '4'}
    )

Notice: updateCount's 4 getting stringified and, the no quotes around the 43d2891f-6041-4572-bcdd-0bb14b96aa5f. This makes assumptions about datatypes in your C* column families.

## License

node-cassandra-cql is distributed under the [MIT license](http://opensource.org/licenses/MIT).

## Contributions

Feel free to join in if you feel like helping this project progress!

## Acknowledgements

FrameReader and FrameWriter are based on [node-cql3](https://github.com/isaacbwagner/node-cql3)'s FrameBuilder and FrameParser.
