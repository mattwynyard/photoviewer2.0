//this code only runs on production server
//main entry point on production server

const app = require('./app');
const port = process.env.PROXY_PORT;
const host = process.env.PROXY;
    
app.listen(port, () => {
  console.log(`Listening: http://${host}:${port}`);
});