export function amount(value,label,{min=0,max=1e12}={}){if(String(value).trim()===''||!Number.isFinite(Number(value)))throw new Error(`Enter ${label}.`);const n=Number(value);if(n<min||n>max)throw new Error(`${label} must be between ${min} and ${max}.`);return n;}
export function estimate(input){
 const expenses=amount(input.expenses,'monthly expenses'),goal=amount(input.goal,'take-home goal'),hours=amount(input.hours,'billable hours',{min:.25,max:744}),reserve=amount(input.reserve,'income tax reserve',{max:95})/100,scope=amount(input.scope,'project hours',{max:100000}),buffer=amount(input.buffer,'project buffer',{max:200})/100,sales=amount(input.sales,'sales tax',{max:100})/100;
 const revenue=expenses+goal/(1-reserve),hourly=revenue/hours,tax=(revenue-expenses)*reserve,base=hourly*scope,contingency=base*buffer,subtotal=base+contingency,salesTax=subtotal*sales;
 return {expenses,goal,hours,reserve,scope,buffer,sales,revenue,hourly,tax,base,contingency,subtotal,salesTax,total:subtotal+salesTax};
}
export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function webAddress(value){const s=String(value??'').trim();if(!s)return '';let url;try{url=new URL(/^[a-z][a-z0-9+.-]*:/i.test(s)?s:'https://'+s);}catch{throw new Error('Enter a valid website address.');}if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new Error('Use a public http or https website address, without login details.');return url.href;}
export function signature(input){
 const name=String(input.name||'Your name').trim().slice(0,90),role=String(input.role||'').trim().slice(0,100),company=String(input.company||'').trim().slice(0,100),email=String(input.email||'').trim(),phone=String(input.phone||'').trim().slice(0,60),url=webAddress(input.website);
 if(email&&!/^[^\s@<>"?]+@[^\s@<>"?]+\.[^\s@<>"?]+$/.test(email))throw new Error('Enter a complete email address.');
 const accent=input.accent==='teal'?'#4caaa0':input.accent==='navy'?'#0c1b2e':'#febf17';
 const e=escapeHTML,lines=[];if(email)lines.push(`<a href="mailto:${e(encodeURIComponent(email))}" style="color:#145f59;text-decoration:none;">${e(email)}</a>`);if(phone)lines.push(`<a href="tel:${e(phone.replace(/[^\d+*#]/g,''))}" style="color:#334155;text-decoration:none;">${e(phone)}</a>`);if(url)lines.push(`<a href="${e(url)}" style="color:#145f59;text-decoration:none;">${e(new URL(url).hostname.replace(/^www\./,'')+new URL(url).pathname.replace(/\/$/,''))}</a>`);
 const html=`<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;color:#0c1b2e;border-collapse:collapse;max-width:480px;"><tr><td style="border-left:4px solid ${accent};padding:3px 0 3px 18px;"><div style="font-size:20px;line-height:26px;font-weight:bold;color:#0c1b2e;">${e(name)}</div>${role||company?`<div style="font-size:12px;line-height:20px;color:#526477;padding:3px 0 10px;">${[role,company].filter(Boolean).map(e).join(' &middot; ')}</div>`:''}<div style="font-size:12px;line-height:21px;overflow-wrap:anywhere;">${lines.join('<br>')}</div></td></tr></table>`;
 return {html,plain:[name,[role,company].filter(Boolean).join(' · '),email,phone,url].filter(Boolean).join('\n')};
}
function entry(value,fallback){const s=String(value||fallback).trim();if(!/^[a-zA-Z0-9_./-]+$/.test(s)||s.startsWith('/')||s.split('/').includes('..'))throw new Error('Use a relative file path with letters, numbers, dots, dashes or underscores.');return s;}
export function configFile({kind,stack,entrypoint,templates={}}){
 if(kind==='dockerignore')return {name:'.dockerignore',note:'Keep credentials and local build artifacts out of the build context. Review this list for your project.',text:'# Local-only files\n.git\n.gitignore\nnode_modules\n.venv\nvenv\n__pycache__\n*.pyc\ncoverage\n.env\n.env.*\n!.env.example\n*.log\n.DS_Store\nThumbs.db\n'};
 if(kind==='gitignore'){
  const container='# Container project — local artifacts\n.env\n.env.*\n!.env.example\n.docker-data/\n.local-volumes/\ncompose.override.yaml\ndocker-compose.override.yml\n*.log\n*.pid\n';
  const key=stack==='react'?'Node':stack==='node'?'Node':stack==='python'?'Python':stack==='go'?'Go':null;
  if(key&&!templates[key])throw new Error('The bundled ignore template is still loading.');
  return {name:'.gitignore',note:key?'Based on the bundled github/gitignore '+key+' template. Review patterns for your repository.':'Container projects still need their Dockerfile and main Compose file in Git.',text:key?templates[key]+(stack==='react'?'\n# Static React / common build outputs\ndist/\nbuild/\n.next/\nout/\n':''):container};
 }
 if(stack==='container')throw new Error('Choose Node.js, Python, static React or Go for a Dockerfile.');
 if(stack==='python')return {name:'Dockerfile',note:'Starter expects requirements.txt. Change the image tag, entry point and exposed port to match your app.',text:`FROM python:3.13-slim\nENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1\nWORKDIR /app\nCOPY requirements.txt ./\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nRUN useradd --create-home appuser\nUSER appuser\nEXPOSE 8000\nCMD ${JSON.stringify(['python',entry(entrypoint,'app.py')])}\n`};
 if(stack==='react')return {name:'Dockerfile',note:'For a static React build with npm and a dist folder. SPA fallback routes need an Nginx configuration; this is not an SSR template.',text:'FROM node:24-alpine AS build\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM nginx:stable-alpine\nCOPY --from=build /app/dist /usr/share/nginx/html\nEXPOSE 80\n'};
 if(stack==='go')return {name:'Dockerfile',note:'Starter expects go.mod/go.sum and a statically linked CGO_ENABLED=0 binary. Review image tags, dependencies and ports.',text:'FROM golang:1.25-alpine AS build\nWORKDIR /src\nCOPY go.mod go.sum ./\nRUN go mod download\nCOPY . .\nRUN CGO_ENABLED=0 go build -o /out/app .\n\nFROM alpine:3.22\nRUN apk add --no-cache ca-certificates\nCOPY --from=build /out/app /usr/local/bin/app\nUSER 65532:65532\nEXPOSE 8080\nENTRYPOINT ["/usr/local/bin/app"]\n'};
 return {name:'Dockerfile',note:'Starter expects package-lock.json and a Node entry file. Edit image tags and ports for your project; Docker builds have not been run by this tool.',text:`FROM node:24-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --omit=dev\nCOPY --chown=node:node . .\nUSER node\nEXPOSE 3000\nCMD ${JSON.stringify(['node',entry(entrypoint,'server.js')])}\n`};
}
export function makeLicense({id,year,holder,project,later=false},texts){
 if(!/^\d{4}(?:[-–]\d{4})?$/.test(String(year).trim()))throw new Error('Use a four-digit year or a year range such as 2024–2026.');
 if(!String(holder).trim())throw new Error('Enter the copyright holder.');
 const h=String(holder).trim().replace(/[\r\n]+/g,' ').slice(0,180),y=String(year).trim(),p=String(project||'Your project').trim().replace(/[\r\n]+/g,' ').slice(0,150);
 let text=texts[id];if(!text)throw new Error('The full license text is still loading.');
 if(id==='MIT'||id==='BSD-3-Clause'){
  for(const token of ['<year>','[year]','[yyyy]'])text=text.replaceAll(token,()=>y);
  for(const token of ['<copyright holders>','<owner>','[fullname]','[name of copyright owner]','<organization>'])text=text.replaceAll(token,()=>h);
 }
 const spdx=id==='GPL-3.0'?(later?'GPL-3.0-or-later':'GPL-3.0-only'):id;
 let notice=`${p}\nCopyright (c) ${y} ${h}\nSPDX-License-Identifier: ${spdx}\n`;
 if(id==='GPL-3.0')notice+=`\nThis program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, ${later?'either version 3 of the License, or (at your option) any later version.':'version 3 of the License.'}\n\nThis program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.\n\nYou should have received a copy of the GNU General Public License along with this program. If not, see https://www.gnu.org/licenses/.\n`;
 if(id==='Apache-2.0')notice+='\nLicensed under the Apache License, Version 2.0. You may obtain a copy at https://www.apache.org/licenses/LICENSE-2.0 . Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.\n';
 return {text,notice,spdx};
}
export function outputSize(width,height,maxWidth){const w=amount(width,'image width',{min:1,max:50000}),h=amount(height,'image height',{min:1,max:50000}),max=amount(maxWidth,'maximum width',{min:1,max:50000}),ratio=Math.min(1,max/w);return {width:Math.max(1,Math.round(w*ratio)),height:Math.max(1,Math.round(h*ratio))};}
export function downloadName(name,extension){const base=String(name).split(/[\\/]/).pop().replace(/\.[^.]*$/,'').replace(/[<>:"|?*\x00-\x1f]/g,'-').slice(0,100)||'file';return base+'.'+extension;}
