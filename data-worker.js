import {parseTable,tablePage,exportTable,LIMITS} from './data-model.js';
let data=null;
self.onmessage=({data:m})=>{try{
 if(m.action==='parse'){if(m.buffer.byteLength>LIMITS.bytes)throw new Error('Choose a file smaller than 10 MB.');let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(m.buffer);}catch{throw new Error('This file is not UTF-8. Save it as UTF-8 CSV or JSON and try again.');}const next=parseTable(text,m.options);data=next;self.postMessage({action:'parsed',id:m.id,...tablePage(data),kind:data.kind,delimiter:data.delimiter});}
 else if(!data)throw new Error('Open a CSV or JSON file first.');
 else if(m.action==='view')self.postMessage({action:'view',id:m.id,...tablePage(data,m.options)});
 else if(m.action==='export')self.postMessage({action:'export',id:m.id,format:m.format,text:exportTable(data,m.options,m.format,m.safe)});
 }catch(error){self.postMessage({action:'error',id:m.id,message:error.message||'This file could not be opened.'});}};
