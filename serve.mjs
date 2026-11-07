import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server=http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);}catch{res.writeHead(404).end('Nenajdene');}});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Port 5173 sa uz pouziva. Otvorte http://127.0.0.1:5173 alebo ukoncite predosly server.':e.message);process.exitCode=1;});
server.listen(5173,'127.0.0.1',()=>console.log('Standio: http://127.0.0.1:5173\nOkno nechajte otvorene. Ukoncenie: Ctrl+C.'));

