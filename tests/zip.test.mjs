import assert from 'node:assert/strict';import {zipFiles} from '../zip.js';
assert.throws(()=>zipFiles([{name:'../outside',data:'x'}]));assert.throws(()=>zipFiles([]));assert.throws(()=>zipFiles([{name:'C:\\bad',data:'x'}]));
const bytes=zipFiles([{name:'.gitignore',data:'node_modules/\n'},{name:'Dockerfile',data:'FROM node:24-alpine\n'},{name:'یادداشت.txt',data:'نمونهٔ UTF-8'}]);
assert.equal(new DataView(bytes.buffer).getUint32(0,true),0x04034b50);assert.equal(new DataView(bytes.buffer).getUint32(bytes.length-22,true),0x06054b50);assert.equal(new DataView(bytes.buffer).getUint16(bytes.length-12,true),3);
console.log('PASS ZIP entries reject unsafe paths and retain UTF-8 names and exact extensionless filenames.');
