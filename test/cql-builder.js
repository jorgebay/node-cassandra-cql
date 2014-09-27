
var CqlBuilder = require('../lib/cql-builder');
var assert = require('assert');
var types = require('../lib/types.js');


var userId = types.uuid();

/**
 * All tests are working with column family user.
 * Create schema for user is :
 create table user (
     id : uuid,
     name text,
     age int,
     friends list<text>,
     family map<text, text>,
     PRIMARY KEY (id, name)
 );

 *
 */
describe('cql builder', function(){

    describe('INSERT query', function(){

        it('with two fields', function() {
            var queryData = new CqlBuilder('user')
                .insert()
                .value('id', userId)
                .value('name', 'Ivan')
                .build();

            assert.deepEqual(queryData.params, [userId, 'Ivan']);
            assert.equal(queryData.query, 'INSERT INTO user ( id , name ) VALUES ( ? , ? );');
        });

        it('with all fields', function() {
            var queryData = new CqlBuilder('user')
                .insert()
                .value('id', userId)
                .value('name', 'Ivan')
                .value('age', 25)
                .value('friends', {value : ['Marko', 'Roko'], hint : types.dataTypes.list })
                .value('family', {value : {'brother' : 'Deni', 'sister' : 'Ana'}, hint : types.dataTypes.map})
                .build();

            assert.deepEqual(queryData.params,
                [userId, 'Ivan', 25, {value : ['Marko', 'Roko'], hint : types.dataTypes.list }, {value : {'brother' : 'Deni', 'sister' : 'Ana'}, hint : types.dataTypes.map}]);
            assert.equal(queryData.query, 'INSERT INTO user ( id , name , age , friends , family ) VALUES ( ? , ? , ? , ? , ? );');
        });
    });

    describe('UPDATE query', function(){

        it('update string and number with one where statement', function() {
            var queryData = new CqlBuilder('user')
                .update()
                .set('name', 'Luka')
                .set('age', 30)
                .where('id', userId)
                .build();

            assert.deepEqual(queryData.params, ['Luka', 30, userId]);
            assert.equal(queryData.query, 'UPDATE user SET name = ? , age = ? WHERE id = ?;');
        });

        it('update user with new list and map with two where statement', function() {
            var queryData = new CqlBuilder('user')
                .update()
                .set('family', {value : {'brother' : 'Deni', 'sister' : 'Ana'}, hint : types.dataTypes.map})
                .set('friends', {value : ['Marko', 'Roko'], hint : types.dataTypes.list })
                .where('id', userId)
                .where('name', 'Ivan')
                .build();

            assert.deepEqual(queryData.params,
                [{value : {'brother' : 'Deni', 'sister' : 'Ana'}, hint : types.dataTypes.map}, {value : ['Marko', 'Roko'], hint : types.dataTypes.list }, userId, 'Ivan']);
            assert.equal(queryData.query, "UPDATE user SET family = ? , friends = ? WHERE id = ? AND name = ?;");
        });

        it('update list and map with two where statement and one has IN', function() {
            var queryData = new CqlBuilder('user')
                .update()
                .setMapField('family', 'brother', 'Toni')
                .appendList('friends', 'Miho')
                .where('id', userId)
                .whereIn('age', [24, 25, 26])
                .build();

            assert.deepEqual(queryData.params, ['Toni', 'Miho', userId, [24, 25, 26]]);
            assert.equal(queryData.query, "UPDATE user SET family['brother'] = ? , friends = friends + [?] WHERE id = ? AND age IN ?;");
        });

    });

    describe('SELECT query', function(){

        it('select * without where', function() {
            var queryData = new CqlBuilder('user')
                .select()
                .build();

            assert.deepEqual(queryData.params, []);
            assert.equal(queryData.query, 'SELECT * FROM user;');
        });

        it('select id and name without where', function() {
            var queryData = new CqlBuilder('user')
                .select('id', 'name')
                .build();

            assert.deepEqual(queryData.params, []);
            assert.equal(queryData.query, 'SELECT id , name FROM user;');
        });

        it('select id and name with two where, one is IN', function() {
            var queryData = new CqlBuilder('user')
                .select('id', 'name')
                .where('id', userId)
                .whereIn('age', [19, 20, 21])
                .build();

            assert.deepEqual(queryData.params, [ userId, [19, 20, 21]]);
            assert.equal(queryData.query, 'SELECT id , name FROM user WHERE id = ? AND age IN ?;');
        });

        it('select * with two where and limit', function() {
            var queryData = new CqlBuilder('user')
                .select()
                .where('name', 'Ivan')
                .where('age', 20)
                .limit(10)
                .build();

            assert.deepEqual(queryData.params, [ 'Ivan', 20]);
            assert.equal(queryData.query, 'SELECT * FROM user WHERE name = ? AND age = ? LIMIT 10;');
        });

    });

    describe('DELETE query', function(){

        it('delete all without where', function() {
            var queryData = new CqlBuilder('user')
                .delete()
                .build();

            assert.deepEqual(queryData.params, []);
            assert.equal(queryData.query, 'DELETE FROM user;');
        });

        it('delete id and name without where', function() {
            var queryData = new CqlBuilder('user')
                .delete('id', 'name')
                .build();

            assert.deepEqual(queryData.params, []);
            assert.equal(queryData.query, 'DELETE id , name FROM user;');
        });

        it('delete id and name with two where, one is IN', function() {
            var queryData = new CqlBuilder('user')
                .delete('id', 'name')
                .where('id', userId)
                .whereIn('age', [19, 20, 21])
                .build();

            assert.deepEqual(queryData.params, [ userId, [19, 20, 21]]);
            assert.equal(queryData.query, 'DELETE id , name FROM user WHERE id = ? AND age IN ?;');
        });
    });

});
