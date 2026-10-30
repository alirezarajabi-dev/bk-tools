export const LIMITS={bytes:10*1024*1024,rows:50000,columns:100,cells:1000000};
const str=v=>v===null||v===undefined?'':typeof v==='object'?JSON.stringify(v):String(v);
export function detectDelimiter(text){text=String(text).replace(/^\uFEFF/,'').replace(/^(?:\r\n|\r|\n)+/,'');const counts={',':0,';':0,'\t':0};let quote=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quote&&text[i+1]==='"'){i++;continue;}quote=!quote;}else if(!quote){if(c==='\r'||c==='\n')break;if(c in counts)counts[c]++;}}return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][1]?Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0]:',';}
export function parseCSV(text,delimiter='auto',limits=LIMITS){
 text=String(text).replace(/^\uFEFF/,'');const sep=delimiter==='auto'?detectDelimiter(text):delimiter;if(![',',';','\t'].includes(sep))throw new Error('Unsupported CSV delimiter.');
 let rows=[],row=[],field='',quoted=false,closed=false,touched=false,line=1,cells=0;
 function endField(){row.push(field);field='';closed=false;if(row.length>limits.columns)throw new Error(`This table has more than ${limits.columns} columns.`);}
 function endRow(){endField();if(touched||row.length>1){rows.push(row);cells+=row.length;if(rows.length>limits.rows+1||cells>limits.cells)throw new Error('This table exceeds the row or cell limit.');}row=[];touched=false;}
 for(let i=0;i<text.length;i++){
  const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else{field+=c;if(c==='\n')line++;}continue;}
  if(c===sep){touched=true;endField();continue;}if(c==='\n'||c==='\r'){endRow();if(c==='\r'&&text[i+1]==='\n')i++;line++;continue;}
  if(closed){if(c===' '||c==='\t'&&sep!=='\t')continue;throw new Error(`Unexpected text after a quoted field near line ${line}.`);}
  if(c==='"'){if(field!=='')throw new Error(`Unexpected quote near line ${line}.`);quoted=true;touched=true;}else{field+=c;touched=true;}
 }
 if(quoted)throw new Error(`An opening quote was not closed near line ${line}.`);if(touched||field||row.length)endRow();return {matrix:rows,delimiter:sep};
}
function headings(values,n){const used=new Set();return Array.from({length:n},(_,i)=>{const raw=str(values[i]).trim()||`Column ${i+1}`;let name=raw,k=2;while(used.has(name))name=raw+' ('+k+++')';used.add(name);return name;});}
function dataset(columns,rows,records,kind,extra={},limits=LIMITS){if(columns.length>limits.columns||rows.length>limits.rows||columns.length*rows.length>limits.cells)throw new Error('This table exceeds the row, column or cell limit.');return {columns,rows,records,kind,search:rows.map(r=>r.map(str).join('\u001f').toLocaleLowerCase()),...extra};}
export function parseTable(text,{type='csv',header=true,delimiter='auto',limits=LIMITS}={}){
 if(type==='json'){
  let parsed;try{parsed=JSON.parse(String(text).replace(/^\uFEFF/,''));}catch{throw new Error('The JSON is not valid. Check its quotes, commas and closing brackets.');}
  const list=Array.isArray(parsed)?parsed:[parsed];if(list.length>limits.rows)throw new Error('This JSON exceeds the row limit.');
  if(list.length&&list.every(x=>x&&typeof x==='object'&&!Array.isArray(x))){const columns=[...new Set(list.flatMap(Object.keys))];return dataset(columns,list.map(x=>columns.map(c=>Object.hasOwn(x,c)?x[c]:null)),list,'json',{},limits);}
  if(list.length&&list.every(Array.isArray)){const n=Math.max(0,...list.map(r=>r.length)),cols=headings([],n);return dataset(cols,list.map(r=>cols.map((_,i)=>r[i]??null)),list,'json',{},limits);}
  return dataset(['Value'],list.map(x=>[x]),list,'json',{},limits);
 }
 const {matrix,delimiter:sep}=parseCSV(text,delimiter,limits);if(!matrix.length)return dataset([],[],[],'csv',{delimiter:sep},limits);
 const n=Math.max(...matrix.map(r=>r.length)),columns=headings(header?matrix[0]:[],n),body=header?matrix.slice(1):matrix,rows=body.map(r=>columns.map((_,i)=>r[i]??'')),records=rows.map(r=>Object.fromEntries(columns.map((c,i)=>[c,r[i]])));
 return dataset(columns,rows,records,'csv',{delimiter:sep},limits);
}
const collator=new Intl.Collator('en',{numeric:true,sensitivity:'base'});
export function filteredIndices(data,{query='',sort=-1,direction=1}={}){const q=String(query).trim().toLocaleLowerCase();let indices=data.rows.map((_,i)=>i).filter(i=>!q||data.search[i].includes(q));if(sort>=0&&sort<data.columns.length)indices.sort((a,b)=>{const av=str(data.rows[a][sort]),bv=str(data.rows[b][sort]);if(!av&&!bv)return a-b;if(!av)return 1;if(!bv)return -1;const numeric=/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;const compare=numeric.test(av)&&numeric.test(bv)&&Number.isFinite(+av)&&Number.isFinite(+bv)?+av-+bv:collator.compare(av,bv);return (compare||0)*(direction===-1?-1:1)||a-b;});return indices;}
export function tablePage(data,options={}){const indices=filteredIndices(data,options),size=[25,50,100].includes(Number(options.size))?Number(options.size):25,totalPages=Math.max(1,Math.ceil(indices.length/size)),page=Math.min(Math.max(0,Math.trunc(Number(options.page)||0)),totalPages-1);return {columns:data.columns,rows:indices.slice(page*size,(page+1)*size).map(i=>data.rows[i].map(str)),total:data.rows.length,filtered:indices.length,page,size,totalPages};}
export function csvCell(value,safe=true){let text=str(value);if(safe&&/^[\s]*[=+\-@]/.test(text)&&!/^\s*[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?\s*$/i.test(text))text="'"+text;return /[",\r\n]/.test(text)?'"'+text.replaceAll('"','""')+'"':text;}
export function exportTable(data,options={},format='csv',safe=true){const indices=filteredIndices(data,options);if(format==='json')return JSON.stringify(indices.map(i=>data.records[i]),null,2)+'\n';return [data.columns,...indices.map(i=>data.rows[i])].map(r=>r.map(v=>csvCell(v,safe)).join(',')).join('\r\n')+'\r\n';}
