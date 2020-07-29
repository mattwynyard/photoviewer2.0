'use strict';
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const db = require('./db.js');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const app = express();
const users = require('./user.js');
const jwt = require('jsonwebtoken');
const jwtKey = process.env.KEY;
const jwtExpirySeconds = 10000;

const fs = require('fs');
const https = require('https');
const http = require('http');
const port = process.env.PROXY_PORT;
const host = process.env.PROXY;
const environment = process.env.ENVIRONMENT;


// comment out create server code below when deploying to server
// server created in index.js
console.log("mode: " + environment);
if(environment === 'production') {
  let hostname = "localhost";
 http.createServer(function(req, res) {
  }).listen(port, hostname, () => {
      console.log(`Listening: http://${hostname}:${port}`);
   });
} else {
  const options = {
    key: fs.readFileSync('./server.key', 'utf8'),
    cert: fs.readFileSync('./server.cert', 'utf8')
  }
  https.createServer(options, app).listen(port, () => {
    console.log(`Listening: https://${host}:${port}`);
    });
}

app.use(cors());
app.use(morgan('dev'));
app.use(helmet());
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.json({limit: '50mb', extended: false}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }))
// Parse JSON bodies (as sent by API clients)


app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  next();
});

app.get('/api', (req, res) => {
  res.send({ express: 'Server online' });
});

app.post('/login', async (request, response, next) => {
  let succeded = null;
  let password = request.body.key;
  let user = request.body.user;
  //uncomment to genrate password for new user
  //generatePassword(password, 10);
  let p = await db.password(user);
  
  if (p.rows.length == 0) { //user doesn't exist
    response.send({ result: false, error: "user doesnt exist" });
    succeded = false;
    //console.log("user doesn't exist");
  } else {
    let count = await db.users(user);
    bcrypt.compare(password, p.rows[0].password.toString(), async (err, res) => {
      count = count.rows[0].count;
      const seed  = user + count;
      if (err) throw err;     
      if (res) {
          const token = jwt.sign({ seed }, jwtKey, {
          algorithm: 'HS256',
          expiresIn: jwtExpirySeconds
      });
        succeded = true;
        count = count += 1;
        await db.updateCount(count, user);
        this.token = token;
        let projects = await db.projects(user);
        //console.log(projects);
        let arr = []; //project arr
        for (var i = 0; i < projects.rows.length; i += 1) {
          arr.push(projects.rows[i]);
        }
        response.set('Content-Type', 'application/json');
        response.cookie('token', token, { maxAge: jwtExpirySeconds * 1000 });
        response.json({ result: true, user: user, token: token, projects: arr});
        users.addUser({
          name: user,
          token: token,
          }
        );
      } else {    
        //console.log("Incorrect password");   
        response.send({ result: false, error: "incorrect password" });
      }
    }); 
  }  
});

app.post('/logout', (req, res) => {
  if (req.headers.authorization === this.token) {
    users.deleteToken(req.body.token);
    res.send({success: true});
  } else {
    res.send({success: false});
  }
});

app.post('/user', async (req, res, next) => {
    if (req.headers.authorization === this.token) {
      try {
        if (req.body.type === "insert") {
          let salt = genSalt(req.body.password);
          salt.then(function(result) {
            let hash = genHash(req.body.password, result.salt);
            hash.then(async function(result) {
              try {
                let q = await db.addUser(req.body.user, result);
                if(q.rowCount === 1) {
                  res.send({success: true})
                } else {
                  res.send({success: false})
                }
              } catch(err) {
                res.send({error: err.err.detail})
              }
            })
          });
        } else if (req.body.type === "delete") {
          try {
            let q = await db.deleteUser(req.body.user);
            if(q.rowCount === 1) {
              res.send({success: true})
            } else {
              res.send({success: false})
            }
          } catch(err) {
            res.send({error: err.err.detail})
          }
        } else {
          try {
            let q = await db.updateUser(req.body.user);
            if(q.rowCount === 1) {
              res.send({success: true})
            } else {
              res.send({success: false})
            }
          } catch(err) {
            res.send({error: err.err.detail})
          }
        }
        
      } catch (err) {
        res.send({error: err});
        next(err);
      }
    } else {
      res.send({success: false});
    }
});

app.post('/usernames', async (req, res, next) => {
 
  if (req.headers.authorization === this.token) {
    
    let result = await db.usernames(req.body.client);
    //console.log(result.rows);
    let arr = [];
    for (let i = 0; i < result.rows.length; i++) {
      if(result.rows[i].username !== "admin") {
        arr.push(result.rows[i].username);
      }

    }
    res.send({success: true, usernames: arr})
  }
});

app.post('/selectprojects', async (req, res, next) => {
 
  if (req.headers.authorization === this.token) {
    let result = await db.selectprojects(req.body.client);
    res.send({success: true, projects: result.rows})
  }
});

app.post('/project', async (req, res, next) => {
  if (req.headers.authorization === this.token) {
    try {
      if (req.body.type === "insert") {
        let q = await db.addProject(req.body);
        if(q.rowCount === 1) {
          res.send({success: true})
        } else {
          res.send({success: false})
        }
      } else {
        let q = await db.deleteProject(req.body);
        if(q.rowCount === 1) {
          res.send({success: true})
        } else {
          res.send({success: false})
        }
      }
    } catch (err) {
      res.send({error: err});
      next(err);
    }
  } else {
    res.send({success: false});
  }
});
/**
 * Gets fault classes from db
 * i.e. user clicked filter from menu
 */
app.post('/class', async (req, res, next) => {
  const result = users.findUserToken(req.headers.authorization, req.body.user);
  if (result) {
    let fclass = await db.class(req.body.project);
    //console.log(fclass);
    res.set('Content-Type', 'application/json')
    res.send(fclass.rows);
  } else {
    res.send({error: "Invalid token"});
    //console.log("invalid token");
  }
});
/**
 * gets faults for specific class
 * 
 */
app.post('/faults', async (req, res, next) => {
  const result = users.findUserToken(req.headers.authorization, req.body.user);
  if (result) {
    let faults = await db.faults(req.body.project, req.body.code);
    let result = [];
    //console.log(faults.rows);
    for (let i = 0; i < faults.rows.length; i++) {
      result.push(faults.rows[i].fault)
    }
    res.set('Content-Type', 'application/json')
    res.send({result: result});
  } else {
    res.send({error: "Invalid token"});
    //console.log("invalid token");
  }
});

app.post('/age', async (req, res) => { 
  const result = users.findUserToken(req.headers.authorization, req.body.user);
  if (result) {
    let project = req.body.project;
    let result = await db.age(project);
    res.set('Content-Type', 'application/json'); 
    res.send({result: result.rows});  
  }
});

app.post('/priority', async (req, res) => { 
  const result = users.findUserToken(req.headers.authorization, req.body.user);
  let priority = null
  if (result) {
    let project = req.body.project;
    let surface = await db.projecttype(project);
    if (surface.rows[0].surface === "footpath") {
      let result = await db.filters(project, "grade");
      let grade = []
      for (let i = 0; i < result.rows.length; i++) {
        let value = Object.values(result.rows[i]);
        if (value[0] === '1' || value[0] === '2') {
          continue;
        } else {
          grade.push(value[0]);
        }
      }
      res.set('Content-Type', 'application/json'); 
      res.send({priority: grade});        
    } else {
      let result = await db.priority(project);
      let priority = [];
      for (let i = 0; i < result.rows.length; i++) {
        let value = Object.values(result.rows[i]);
        priority.push(value[0]);
      }
      res.set('Content-Type', 'application/json'); 
      res.send({priority: priority});        
    }    
  }
});

app.post('/dropdown', async (req, res) => { 
  const result = users.findUserToken(req.headers.authorization, req.body.user);
  if (result) {
    let project = req.body.project;
    let code = req.body.code;
    let data = await db.filters(project, code);
    let result = [];
    for (let i = 0; i < data.rows.length; i++) {
      let value = Object.values(data.rows[i]);
      result.push(value[0]);
    }
    //console.log(result);
    res.set('Content-Type', 'application/json');
    res.send({result: result});   
  }
});
/**
 * gets faults for specfic filter (project - fault type - priority)
 * from db
 */
app.post('/layer', async (req, res) => {
  const result = users.findUserToken(req.headers.authorization, req.body.user);
  if (result) {
    //console.log(req.body);
    let filterObj = req.body.filterObj;
    let project = req.body.project;
    let filter = req.body.filter;
    let priority = req.body.priority;
    let inspection = req.body.inspection;
    let assets = req.body.assets;
    let faults = req.body.faults;
    let types = req.body.types;
    let causes = req.body.causes;
    let geometry = null;
    let surface = await db.projecttype(project);
    if (surface.rows[0].surface === "footpath") {
      geometry = await db.footpath(project, priority, assets, faults, types, causes);

    } else if (surface.rows[0].surface === "road") {
      geometry = await db.layer(project, filter, priority, inspection);
    } else {
      res.send({error: "Layer not found"});
    }
    if (filter.length === 0) {
      await db.updateLayerCount(project);
    } else {
      await db.updateFilterCount(project);
    }  
    res.set('Content-Type', 'application/json');
    res.send({type: surface.rows[0].surface, geometry: geometry.rows});
  } else {
    res.send({error: "Invalid token"});
  } 
});
/**
 * gets centrelines for specfic ta code
 */
app.post('/roads', async (req, res, next) => {
  //console.log(req.body);
  const result = users.findUserToken(req.headers.authorization, req.body.user);
  let code = req.body.code;
  if (result) {
    let layer = req.body.menu;
    let geometry = await db.road(code);
    res.set('Content-Type', 'application/json');
    res.send(geometry.rows);
  } else {
    res.set('Content-Type', 'application/json');
    res.send({error:"Resource unavailable"});
    //console.log("Resource unavailable")

  }  
});

app.post('/status', async (req, res) => {
  const token = users.findUserToken(req.headers.authorization, req.body.user);
 
  if (token) {
    let id = req.body.marker[0].id;
    let project = req.body.project;
    let status = req.body.status;
    let date = req.body.date;
    let result = await db.updateStatus(project, id, status, date);
    if(result.rowCount === 1) {
      res.set('Content-Type', 'application/json');
      res.send({rows: "Updated 1 row"});
    } else {
      console.log(result);
      res.set('Content-Type', 'application/json');
      res.send({error: "failed to update"});
    }
  }
});

app.post('/gps', (req, res) => {
  //console.log(req.body.marker[0].id);
  res.set('Content-Type', 'application/json');
  res.send({ express: 'Server online' });
});

app.post('/import', async (req, res) => {
  //let project = "TEST";
  let project = req.body.project;
  console.log(project);
  let surface = await db.projecttype(project);
  if (surface.rows[0].surface === "road") {
    let result = await db.gid();
    let gid = result.rows[0].max + 1;
    let rows = 0;
    let errors = 0;
    for (let i = 1; i < req.body.data.length - 1; i++) {  
      let data =  req.body.data[i];
      data.unshift(gid);
      let result = await db.import(project, data);
      if(result.rowCount === 1) {
        rows++;
      } else {
        errors++
      }
      gid++
    } 
    console.log("Inserted " + (rows) + " rows");
    res.send({rows: "Inserted " + rows + " rows", errors: errors + " rows failed to insert"})
  } else {
    let rows = 0;
    let errors = 0;
    for (let i = 1; i < req.body.data.length - 1; i++) {  
      let data =  req.body.data[i];
      let result = await db.importFootpath(data);
      if(result.rowCount === 1) {
        rows++;
      } else {
        errors++
      }
     
  }
  console.log("Inserted " + (rows) + " rows");
  res.send({rows: "Inserted " + rows + " rows", errors: errors + " rows failed to insert"})
}
});

function genSalt() {
  return new Promise(async (resolve, reject) => {
    await bcrypt.genSalt(10, function(err, salt) {
      if (err) {
        reject(err);
      } else {
        resolve({
          salt: salt
        });
      }
    });
  });
}

async function genHash(password, salt) {
    return new Promise(async (resolve, reject) => {
    await bcrypt.hash(password, salt, async function(err, hash) {
        if (err) {
          reject(err);
        } else {
          resolve(hash);
        }
      });
  });
}
module.exports = app;