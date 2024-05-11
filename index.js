const bodyParser = require("body-parser");
const express = require("express");
const multer = require('multer');
const fs = require('fs');
const app = express();
app.set('view engine','ejs');
app.use(express.static('public'));
app.use('/docs',express.static('./Data/docs'));
app.engine('.html',require('ejs').__express);
app.use(bodyParser.json({'limit':'50mb'}));
app.use(bodyParser.urlencoded({'limit':'50mb',extended:true}));
app.disable('x-powered-by');

const upload = multer({storage:multer.memoryStorage()});

const File = {
    read: function(a, b) {
        try {
            return fs.readFileSync(a, b);
        } catch (e) {
            return null;
        }
    },
    save: function(a, c, d) {
        let b = a.split('/').pop();
        a = a.replace('/' + b, '');
        if(!fs.existsSync(a)) fs.mkdirSync(a,{recursive:true});
        fs.writeFileSync(a + '/' + b, c, d);
        return true;
    },
    remove: function(a) {
        fs.unlinkSync(a);
        return true;
    }
}

const api_name = 'Image & Docs Upload';
const allow_ext = {
	image:['png','jpg','jpeg','gif','bmp'],
	docs:['ppt','pptx','docx','doc','xls','xlsx','hwp','pdf']
};

const Data = {
	find : function(id,req) {
		let db = File.read(`./Data/Data.json`)?JSON.parse(String(File.read(`./Data/Data.json`))):[];
		if(db.find(e=>e.id===id)) {
			db = db[db.findIndex(e=>e.id===id)];
			return {
				'id':db.id,
				'type':db.type,
				'name':db.type!=='url'?db.name:undefined,
				'ext':db.type!=='url'?db.ext:undefined,
				'url':db.type==='url'?db.url:`http://${req.headers.host}/${id}`,
				'domain':`http://${req.headers.host}`
			}
		} else return undefined;
	},
	random : function(num) {
		let res='',text='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let db = File.read(`./Data/Data.json`)?JSON.parse(File.read(`./Data/Data.json`)):[];
		for(let i=0;i<num;i++) res+=text[Math.random()*text.length|0];
		if(db.find(e=>e.id===res)) return this.random(num);
    	else return res;
	}
}

app.get('/',(req,res)=>{
    // res.render('before_index.html');
    res.render('index.html');
});

app.get('/main',(req,res)=>{//temp
	res.render('index.html');
});

app.post('/result',upload.single('file'),(req,res)=>{
	let url = req.body.url?req.body.url:'';
	if(url.indexOf('https://')===0 || url.indexOf('http://')===0) {
		let db = File.read(`./Data/Data.json`)?JSON.parse(File.read(`./Data/Data.json`)):[];
		let result = {'id':Data.random(10),'type':'url','url':url};
		db.push(result);
		File.save(`./Data/Data.json`,JSON.stringify(db));
		console.log(Data.find(result.id,req))
        res.render('result.html',{db:Data.find(result.id,req)});
	} else if(req.file) {
		let name = req.file.originalname.split('.'),ext=name.pop();name=name.join('.');
		if(allow_ext.image.indexOf(ext)!==-1 || allow_ext.docs.indexOf(ext)!==-1) {
			let db = File.read(`./Data/Data.json`)?JSON.parse(File.read(`./Data/Data.json`)):[];
			let result = {
				'id':Data.random(10),
				'type':allow_ext.docs.indexOf(ext)!==-1?'docs':'image',
				'name':name,
				'ext':ext
			}
			db.push(result);
			File.save(`./Data/${result.type}/${result.id}.${result.ext}`,req.file.buffer,'buffer');
			File.save(`./Data/Data.json`,JSON.stringify(db));
            res.render('result.html',{db:Data.find(result.id,req)});
		} else res.json({'type':api_name,'status':'fail','result':'Invailed Extension.'});
	} else res.json({'type':api_name,'status':'fail','result':'Invailed Type.'});
});

// app.get('/search',(req,res)=>{
//     let list=[];
//     if(!req.query.q) res.json(list);
// 	let db = File.read(`./Data/Data.json`)?JSON.parse(File.read(`./Data/Data.json`)):[];
// 	db.forEach(x=>{if(x.name.indexOf(req.query.q)!==-1) list.push(x)});
// 	res.json(list);//출력
//     // res.render('search.html',{list:list});
// });

app.get('/:id',(req,res)=>{
    let db = Data.find(req.params.id,req);
    if(!db) res.redirect('/');
    else if(db.type==='image') {
        let image = Buffer.from(File.read(`./Data/image/${db.id}.${db.ext}`,'base64'),'base64');
        res.writeHead(200, {
        	'Content-Type': 'image/'+db.ext,
        	'Content-Length': image.length,
        	'Content-Disposition': `inline; filename="${encodeURI(db.name)}.${db.ext}"`
        });
		res.end(image);
    } else if(db.type==='docs') res.redirect(`/docs/${db.id}.${db.ext}`);
    else if(db.type==='url') res.redirect(db.url);
});

app.get('/info/:id',(req,res)=>{
    let db = Data.find(req.params.id,req);
    if(!db || db.type==='url') res.redirect('/');
    else res.render('info.html',{db:db});
});

app.listen(10000,()=>console.log('Image & Docs Hosting Started!'));
