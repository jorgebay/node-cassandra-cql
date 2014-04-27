
// TODO add ttl and timestamp to queries and counter data type
/**
 * Object for easier building cql queries
 * @param {String} columnFamily name of column family for building query
 * @constructor
 */
var CqlBuilder = function(columnFamily){
    this.table = columnFamily;
    this.query = "";
    this.params = [];

    this.selectFields = [];
    this.selectLimit = null;

    this.deleteFields = [];

    this.valueQuery = [];
    this.setQuery = [];
    this.whereQuery = [];

    this.valueParams = [];
    this.setParams = [];
    this.whereParams = [];

    this.buildType = null;

    // builder for insert
    this.insertBuild = function(){
        var self = this;

        self.query += "INSERT INTO " + this.table + " ( ";
        self.query += self.valueQuery.join(' , ');
        self.query += " ) VALUES ( ";
        self.query += self.createQuestionMarks(self.valueQuery.length);
        self.query += " );";

        return {
            query : self.query,
            params : self.valueParams
        };
    };

    // builder for update
    this.updateBuild = function(){
        var self = this;

        self.query += "UPDATE " + this.table + " SET ";
        self.query += self.setQuery.join(' , ');
        self.appendWhereClause();
        self.query += ";";

        return {
            query : self.query,
            params : self.setParams.concat(self.whereParams)
        };
    };

    // builder for select
    this.selectBuild = function(){
        var self = this;

        if(self.selectFields.length !== 0){
            self.query += "SELECT " + self.selectFields.join(' , ') + " FROM " + self.table;
        }else{
            self.query += "SELECT * FROM " + self.table;
        }

        self.appendWhereClause();
        if (self.selectLimit){
            self.query += " LIMIT " + self.selectLimit;
        }
        self.query += ";";

        return {
            query : self.query,
            params : self.whereParams
        };
    };

    // builder for select
    this.deleteBuild = function(){
        var self = this;

        if(self.deleteFields.length !== 0){
            self.query += "DELETE " + self.deleteFields.join(' , ') + " FROM " + self.table;
        }else{
            self.query += "DELETE FROM " + self.table;
        }

        self.appendWhereClause();
        self.query += ";";

        return {
            query : self.query,
            params : self.whereParams
        };
    };

    /**
     * Helper method for creating question marks for insert
     * @param {Number} n number of question marks
     * @returns {string}
     */
    this.createQuestionMarks = function(n){
        var questionMarks = [];
        for(var i=0; i<n; i++){
            questionMarks.push('?');
        }
        return questionMarks.join(' , ');
    };

    /**
     * Helper method for adding where clause to query
     */
    this.appendWhereClause = function(){
        var self = this;
        if(self.whereQuery.length !==0){
            self.query += " WHERE ";
            self.query += self.whereQuery.join(' AND ');
        }
    };
};

/**
 * Method for making query as insert
 * @returns {CqlBuilder}
 */
CqlBuilder.prototype.insert = function(){
    this.buildType = 'insertBuild';
    return this;
};

/**
 * Method for making query as update
 * @returns {CqlBuilder}
 */
CqlBuilder.prototype.update = function(){
    this.buildType = 'updateBuild';
    return this;
};

/**
 * Method for making query as select
 * @returns {CqlBuilder}
 */
CqlBuilder.prototype.select = function(){
    this.selectFields = Array.prototype.slice.call(arguments, 0);
    this.buildType = 'selectBuild';
    return this;
};

/**
 * Method for making query as delete
 * @returns {CqlBuilder}
 */
CqlBuilder.prototype.delete = function(){
    this.deleteFields = Array.prototype.slice.call(arguments, 0);
    this.buildType = 'deleteBuild';
    return this;
};

/**
 * Method for adding values in insert query
 * @param {String} column name of column
 * @param value value of column
 * @returns {CqlBuilder}
 */
CqlBuilder.prototype.value = function(column, value){
    var self = this;
    self.valueQuery.push(column);
    self.valueParams.push(value);
    return this;
};


/**
 * Method for adding elements for update to update query
 * @param {String} column name of column update
 * @param value value of column
 * @returns {CqlBuilder}
 */
CqlBuilder.prototype.set = function(column, value){
    var self = this;
    self.setQuery.push(column + " = ?");
    self.setParams.push(value);
    return this;
};

/**
 * Method for updating map in update query
 * @param {String} column name of column map for update
 * @param {String} key map key for update
 * @param value new value of key in map column
 * @returns {CqlBuilder}
 */
CqlBuilder.prototype.setMapField = function(column, key, value){
    this.setQuery.push(column + "['" + key + "']"   + " = ?");
    this.setParams.push(value);
    return this;
};

/**
 * Method for appending values to the end of list
 * @param {String} column name of column list for update
 * @param value new value for appending to list
 * @returns {CqlBuilder}
 */
CqlBuilder.prototype.appendList = function(column, value){
    this.setQuery.push(column + " = " + column + " + [?]");
    this.setParams.push(value);
    return this;
};

/**
 * Method for adding elements of where clause in query
 * @param {String} column name of column for where element
 * @param value value that column must satisfy
 * @returns {CqlBuilder}
 */
CqlBuilder.prototype.where = function(column, value){
    this.whereQuery.push(column + " = ?");
    this.whereParams.push(value);
    return this;
};

/**
 * Method for adding IN elements to where clause in query
 * @param {String} column name of column
 * @param {Array} values values that column must satisfy
 * @returns {CqlBuilder}
 */
CqlBuilder.prototype.whereIn = function(column, values){
    this.whereQuery.push(column + " IN ?");
    this.whereParams.push(values);
    return this;
};

/**
 * Method for adding limit to select order
 * @param {number} limit number of rows that we want to see
 * @returns {CqlBuilder}
 */
CqlBuilder.prototype.limit = function(limit){
    this.selectLimit = limit;
    return this;
};


/**
 * Method for building query
 * @returns {{query: string, params: Array}}
 */
CqlBuilder.prototype.build = function(){
    var self = this;
    return self[self.buildType]();
};


module.exports = CqlBuilder;