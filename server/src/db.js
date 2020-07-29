'use strict'
require('dotenv').config();

function buildQuery(arr) {
    var query = ""; //priority codes
    for (var i = 0; i < arr.length; i += 1) {
        if (i < arr.length - 1) {
            query += ("'" + arr[i] + "'" + ",");
        } else {
            query += "'" + arr[i] + "'";
        }
    }
    return query;
}

function parseInteger(x) {
    let n = parseInt(x)
    if (Number.isNaN(n)) {
        return 'NULL';
    } else {
        return n;
    }
}

function parseString(s) {
    if (s.indexOf('\'') >= 0) {
        let index = s.indexOf('\'');
        let str = s.substring(0, index) + s.substring(index + 1, s.length);
        console.log(str);
        return parseString(str);
    } else {
        return "'" + s + "'";
    }
}

const { Pool } = require('pg');

const connection = new Pool({
    user: process.env.USER_NAME,
    host: process.env.HOST,
    database: process.env.DB,
    password: process.env.PASSWORD,
    port: process.env.PORT,
    max: 20,
    connectionTimeoutMillis: 2000,
})
connection.connect(function(err) {
    if (err) {
        console.log(err);
        throw err;
    }
});
connection.on('connect', () => {
    console.log("connected to database on port: " + process.env.PORT);
});

connection.on('error', error => {
    console.log(error);
});

module.exports = { 
    projects : (user) => {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT code, description, date, amazon, surface FROM projects WHERE client = $1::text AND active = true';
            connection.query(sql, [user], (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let project = resolve(result);
                return project;
            });
        });
    },

    priority: (project) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT priority FROM carriageways WHERE project = '" + project + "' GROUP BY priority";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let priority = resolve(result);
                return priority;
            });
        });
    },

    gid: () => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT MAX(gid) from carriageways";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let max = resolve(result);
                return max;
            });
        });
    },

    updateStatus: (project, id, status, date) => {

        let pid = project + "_" + id;
        let sql = null
        if (date === null) {
            sql = "UPDATE footpaths SET status= '" + status + "', datefixed= NULL WHERE id='" + pid + "'"; 
        } else {
            sql = "UPDATE footpaths SET status= '" + status + "', datefixed= '" + date + "' WHERE id='" + pid + "'";
        }
        
        return new Promise((resolve, reject) => {
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let res = resolve(result);
                return res;
            });
        });
    },

    importFootpath: (data) => {
        //console.log(data);
        data[0] = parseString(data[0]); //id
        data[1] = parseString(data[1]); //project
        data[2] = parseInteger(data[2]); //footpathid
        data[3] = parseString(data[3]); //roadname
        data[4] = parseInteger(data[4]); //roadid
        data[5] = parseString(data[5]); //area
        data[6] = parseString(data[6]); //displacement
        data[7] = parseString(data[7]); //position
        data[8] = parseInteger(data[8]); //erp
        data[9] = parseString(data[9]); //side
        data[10] =parseString(data[10]); //asset
        data[11] = parseString(data[11]);//zone
        data[12] = parseString(data[12]); //type
        data[13] = parseString(data[13]); //fault
        data[14] = parseString(data[14]); //cause
        data[15] = parseString(data[15]); //size
        data[16] = parseFloat(data[16]); //length
        data[17] = parseFloat(data[17]); //width
        data[18] = parseInteger(data[18]); //grade
        data[19] = parseString(data[19]); //comment
        data[20] = parseString(data[20]); //date
        data[21] = parseFloat(data[21]); //latitude
        data[22] = parseFloat(data[22]); //longitude
        data[23] = parseString(data[23]); //faulttime
        data[24] = parseString(data[24]); //inspector
        data[25] = parseInteger(data[25]); //seq
        data[26] = parseString(data[26]); //photoid


        return new Promise((resolve, reject) => {
            let sql = "INSERT INTO footpaths(id, project, footpathid, roadname, roadid, area, displacement, position, erp, side, asset, zone, type, " +
                        "fault, cause, size, length, width, grade, comment, inspection, latitude, longitude, faulttime, inspector, seq, photoid, geom) "
                 + "VALUES (" + data + ", ST_MakePoint(" + data[22] + "," + data[21] + "));"
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let priority = resolve(result);
                return priority;
            }); 
        });
    },

    import: (project, data) => {
        return new Promise((resolve, reject) => {
            data[1] = "'" + data[1] + "'"; //id
            data[2] = "'" + data[2] + "'"; //project
            data[3] = "'" + data[3] + "'"; //service
            data[4] = "'" + data[4] + "'"; //group
            data[5] = "'" + data[5] + "'"; //board
            data[6] = parseInteger(data[6]); //area
            data[7] = parseInteger(data[7]); //roadid
            data[8] = parseInteger(data[8]); //carriagewa
            data[9] = "'" + data[9] + "'"; //board
            data[10] = parseInteger(data[10]); //erp
            data[11] = "'" + data[11] + "'"; //side
            data[12] = "'" + data[12] + "'"; //position
            data[13] = "'" + data[13] + "'"; //class
            data[14] = "'" + data[14] + "'"; //fault
            data[15] = "'" + data[15] + "'"; //repair
            data[16] = parseInteger(data[16]); //priority
            data[17] = "'" + data[17] + "'"; //comment
            data[18] = "'" + data[18] + "'"; //size
            data[19] = parseInteger(data[19]); //length
            data[20] = parseInteger(data[20]); //width
            data[21] = parseInteger(data[21]); //total
            data[22] = parseFloat(data[22]); //easting
            data[23] = parseFloat(data[23]); //northing
            data[24] = parseFloat(data[24]); //latitude
            data[25] = parseFloat(data[25]); //longitude
            data[26] = "'" + data[26] + "'"; //faultime
            data[27] = "'" + data[27] + "'"; //inspector
            data[28] = "'" + data[28] + "'"; //inspection
            data[29] = parseInteger(data[29]); //seq
            data[30] = parseInteger(data[30]); //faultid
            data[31] = "'" + data[31] + "'"; //photoid
            let sql = "INSERT INTO carriageways(gid, id, project, service," + '"group"' + ", board, area, roadid, " 
                 + "carriagewa, location, erp, side, position, class, fault, repair, priority, comment, "
                 + "size, length, width, total, easting, northing, latitude, longitude, faulttime, inspector, inspection, seq, faultid, photoid, geom) "
                 + "VALUES (" + data + ", ST_MakePoint(" + data[25] + "," + data[24] + "));"
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let priority = resolve(result);
                return priority;
            });
        });
    },

    age: (project) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT inspection FROM carriageways WHERE project = '" + project + "' GROUP BY inspection";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let priority = resolve(result);
                return priority;
            });
        });
    },

    filters: (project, parameter) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT " + parameter + " FROM footpaths WHERE project = '" + project + "' GROUP BY " + parameter + "";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let type = resolve(result);
                return type;
            });
        });
    },

    classes: ()=> {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT code, description FROM assetclass WHERE code IN (SELECT class FROM carriageways GROUP BY class) ORDER BY priority';
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let classes = resolve(result);
                return classes;
            });
        });
    },

    class: (project) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT code, description FROM assetclass WHERE code IN (SELECT class FROM carriageways WHERE project = '" + project + "' GROUP BY class) ORDER BY priority";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let classes = resolve(result);
                //console.log(project);
                return classes;
            });
        });
    },

    usernames: () => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT username FROM users";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let clients = resolve(result);
                return clients;    
            });
        });
    },

    selectprojects: (client) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT * FROM projects WHERE client = '" + client + "'";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let clients = resolve(result);
                return clients;    
            });
        });
    },

    //DEPRECIATED
    faults: (project, code) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT fault FROM carriageways WHERE project = '" + project + "' AND class = '" + code + "' GROUP BY fault";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let faults = resolve(result);
                return faults;
            });
        });
    },

    road: (code) => { 
        return new Promise((resolve, reject) => {
            connection.query("SELECT gid, assetroadi, carriagewa, fullroadna, onrcclass, tacode, ST_AsGeoJSON(geom) FROM roads WHERE tacode = '" + code + "'", (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let geometry = resolve(result);
                return geometry;
            });
        });
    },

    updateLayerCount: (layer) => {
        return new Promise((resolve, reject) => { 
            try {
                connection.query("UPDATE projects SET layercount = layercount +"   + 1 + ", layermodified = now() WHERE code = '" + layer + "'", (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack);
                    return reject(err);
                }
                let results = resolve(result);
                return results; 
                });
            } catch (error) {
                return reject(error);
            }       
        });
    },

    updateFilterCount: (layer) => {
        return new Promise((resolve, reject) => {
            try {
                connection.query("UPDATE projects SET filtercount = filtercount + " + 1 + ", lastfilter = now() WHERE code = '" + layer + "'", (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack);
                    return reject(err);
                }
                let results = resolve(result);
                return results; 
                });
            } catch (error) {
                return reject(error);
            }          
        });
    },

    projecttype: (project) => {
        return new Promise((resolve, reject) => {
            connection.query("SELECT surface FROM projects WHERE code = '" + project + "'", (err, result) => {
            if (err) {
                console.error('Error executing query', err.stack)
                return reject(err);
            }
            let surface = resolve(result);          
            return surface;
            }); 
        });

    },

    client: (project) => {
        return new Promise((resolve, reject) => {
            connection.query("SELECT client FROM projects WHERE code = '" + project + "'", (err, result) => {
            if (err) {
                console.error('Error executing query', err.stack)
                return reject(err);
            }
            let surface = resolve(result);          
            return surface;
            }); 
        });

    },

    footpath: (project, priority, assets, faults, types, causes) => {
        let _priority = buildQuery(priority);
        let _assets = buildQuery(assets);
        let _faults = buildQuery(faults);
        let _types = buildQuery(types);
        let _causes = buildQuery(causes);
        let sql = "SELECT id, footpathid, roadname, roadid, position, erp, asset, fault, cause, size, grade, faulttime, status, datefixed, notes, photoid, ST_AsGeoJSON(geom) " 
        + "FROM footpaths WHERE project = '" + project + "' AND grade IN (" + _priority + ") AND asset IN (" + _assets + ") AND fault IN (" + _faults + ") "
        + "AND type IN (" + _types + ") AND cause IN (" + _causes + ")";
        return new Promise((resolve, reject) => {
                connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let geometry = resolve(result);          
                return geometry;
            });
        });
    },

    layer: (layer, filter, priority, inspection) => { 
        let codes = buildQuery(priority);
        let qAge = buildQuery(inspection);
        console.log(inspection);
        return new Promise((resolve, reject) => {
            if (inspection.length === 0) {
                connection.query("SELECT id, roadid, carriageway, location, fault, repair, priority, comment, size, inspection, photoid, faulttime, status, datefixed, ST_AsGeoJSON(geom) " 
                + "FROM carriageways WHERE project = '" + layer + "' AND priority IN (" + codes + ")", (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let geometry = resolve(result);          
                return geometry;
                }); 
            }  else if (filter.length == 0) {
                connection.query("SELECT id, roadid, carriageway, location, fault, repair, priority, comment, size, inspection, photoid, faulttime, status, datefixed, ST_AsGeoJSON(geom) " 
                + "FROM carriageways WHERE project = '" + layer + "' AND priority IN (" + codes + ") AND inspection IN (" + qAge + ")", (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let geometry = resolve(result);          
                return geometry;
                }); 
            } else {
                let condition = buildQuery(filter);
                connection.query("SELECT id, roadid, carriageway, location, fault, repair, priority, comment, size, inspection, photoid, faulttime, status, datefixed, ST_AsGeoJSON(geom) " 
                + "FROM carriageways WHERE project = '" + layer + "' AND fault IN (" + condition + ") AND priority IN (" + codes + ") AND inspection IN (" + qAge + ")", (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let geometry = resolve(result);
                return geometry;
                });
            }            
        });
    },

    password: (username) => {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT password FROM users WHERE username = $1::text';
            connection.query(sql, [username], (err, results) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let p = resolve(results);    
                return p;
            });
        });
    },

    users: (username) => {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT count FROM users WHERE username = $1::text';
            connection.query(sql, [username], (err, results) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let p = resolve(results);
                //console.log(results);
                return p;
            });
        });
    },

    addUser: (user, password) => {
        return new Promise((resolve, reject) => {
            let sql = "INSERT INTO users(username, password, created, count, lastlogin, filtercount, lastfilter) VALUES ('"
             + user + "', '" + password + "', now(), 0, now(), 0, now())";

            connection.query(sql, (err, results) => {
                if (err) reject({ type: 'SQL', err});
                resolve(results);
            });
        })
    },

    deleteUser: (user) => {
        return new Promise((resolve, reject) => {
            let sql = "DELETE FROM users WHERE username= '" + user + "'";
            connection.query(sql, (err, results) => {
                if (err) reject({ type: 'SQL', err});
                resolve(results);
            });
        })
    },

    // deleteProject: (user) => {
    //     return new Promise((resolve, reject) => {
    //         let sql = "DELETE FROM users WHERE username= '" + user + "'";
    //         connection.query(sql, (err, results) => {
    //             if (err) reject({ type: 'SQL', err});
    //             resolve(results);
    //         });
    //     })
    // },

    addProject: (body) => {
        console.log(body);
        return new Promise((resolve, reject) => {
            let sql = "INSERT INTO projects(" +
                "code, client, description, date, tacode, active, amazon, layercount, layermodified, filtercount, lastfilter, surface)" +
                "VALUES ('" + body.code + "', '" + body.client + "', '" + body.description + "', '" + body.date + "', '" + body.tacode + 
                "', true, '" + body.amazon + "', 0, now(), 0, now(), '" + body.surface + "')";

            connection.query(sql, (err, results) => {
                if (err) reject({ type: 'SQL', err});
                resolve(results);
            });
        })
    },

    updateCount: (count, user) => {
        return new Promise((resolve, reject) => {
            let sql = "UPDATE users SET count = " + count + " WHERE username = '" + user + "'";
            connection.query(sql, (err, results) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let p = resolve(results);
                return p;
            });
        });
    }

}
