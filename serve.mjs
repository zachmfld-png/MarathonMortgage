import http from 'http';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname);
const port = process.env.PORT || 3000;

const mime = new Map([
  ['.html','text/html'], ['.css','text/css'], ['.js','application/javascript'],
  ['.png','image/png'], ['.jpg','image/jpeg'], ['.jpeg','image/jpeg'], ['.svg','image/svg+xml'],
  ['.json','application/json'], ['.woff2','font/woff2']
]);

function sendFile(res, filePath){
  const ext = path.extname(filePath).toLowerCase();
  const type = mime.get(ext) || 'application/octet-stream';
  fs.readFile(filePath, (err, data)=>{
    if(err){
      res.writeHead(404, {'Content-Type':'text/plain'});
      res.end('Not found');
      return;
    }
    res.writeHead(200, {'Content-Type':type});
    res.end(data);
  });
}

const server = http.createServer((req,res)=>{
  try{
    const urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
    let safePath = path.normalize(urlPath).replace(/^\/+/, '');
    if(!safePath || safePath.endsWith('/')) safePath += 'index.html';
    const filePath = path.join(root, safePath);
    if(filePath.indexOf(root) !== 0){
      res.writeHead(400, {'Content-Type':'text/plain'});
      res.end('Bad request');
      return;
    }
    if(fs.existsSync(filePath) && fs.statSync(filePath).isFile()){
      sendFile(res,filePath);
      return;
    }
    // fallback to index.html
    const index = path.join(root,'index.html');
    if(fs.existsSync(index)){
      sendFile(res,index);
      return;
    }
    res.writeHead(404, {'Content-Type':'text/plain'});
    res.end('Not found');
  }catch(e){
    res.writeHead(500, {'Content-Type':'text/plain'});
    res.end('Server error');
  }
});

server.listen(port, ()=>{
  console.log(`Serving ${root} at http://localhost:${port}`);
});

process.on('uncaughtException', (err)=>{
  console.error('Uncaught', err);
});
