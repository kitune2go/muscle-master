const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');

const args=process.argv.slice(2);
const valueAfter=(flag,fallback)=>{
  const index=args.indexOf(flag);
  return index>=0&&args[index+1]?args[index+1]:fallback;
};
const host=valueAfter('--host','0.0.0.0');
const port=Number(valueAfter('--port',process.env.PORT||5173));
const root=process.cwd();
const mime={
  '.css':'text/css; charset=utf-8',
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.png':'image/png',
  '.svg':'image/svg+xml',
  '.webp':'image/webp'
};

http.createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
  const relative=pathname==='/'?'index.html':pathname.replace(/^\/+/, '');
  const filename=path.resolve(root,relative);
  if(filename!==root&&!filename.startsWith(`${root}${path.sep}`)){
    response.writeHead(403).end('Forbidden');
    return;
  }
  fs.stat(filename,(statError,stat)=>{
    const target=!statError&&stat.isDirectory()?path.join(filename,'index.html'):filename;
    fs.readFile(target,(readError,data)=>{
      if(readError){response.writeHead(404).end('Not found');return;}
      response.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream'});
      response.end(data);
    });
  });
}).listen(port,host,()=>console.log(`Muscle Master preview: http://${host}:${port}`));
