const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const bcrypt =require('bcrypt-nodejs');
const mysql = require('mysql');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const PORT = process.env.PORT || 5000;



 // Express session
 app.use(
	session({
	  secret: 'secret',
	  resave: false,
	  saveUninitialized: false
	})
  );

//database config

let db =mysql.createConnection({
	host:'localhost',
	user:'root',
	password:'',
	database:''

})
  
 
let sql = 'CREATE DATABASE IF NOT EXISTS DM';
    db.query(sql, (err, result) => {
        if(err) throw err;
        console.log('Database created...');
    });

 

 db =mysql.createConnection({
	host:'localhost',
	user:'root',
	password:'',
	database:'DM'

})

//database connection

db.connect((err)=>{
	if(err){
		throw err;
	}else{
		console.log('db connected');
	}
})

// Create table
    let sql2 = 'CREATE TABLE IF NOT EXISTS posts(id int AUTO_INCREMENT, title VARCHAR(255), body VARCHAR(255),user_id int, autoris VARCHAR(255) , PRIMARY KEY(id))';
    db.query(sql2, (err, result) => {
        if(err) throw err;
        console.log('Posts table created...');
    });


	let sql3 = 'CREATE TABLE IF NOT EXISTS users(id int AUTO_INCREMENT, nom VARCHAR(255), prenom VARCHAR(255), user_name VARCHAR(255) ,  mail VARCHAR(255) , password VARCHAR(255), autoris VARCHAR(255) , PRIMARY KEY(id))';
    	db.query(sql3, (err, result) => {
        if(err) throw err;
        console.log('users table created...');
    });




//ejs

app.set('view engine','ejs');

//body parser
app.use(express.urlencoded({extended: true}));



//images routes
 app.use('/images', express.static('images'));



//index route
app.get('/',(req, res)=>{
	if(!req.session.userId){
	res.render('index');}else{
		res.render('dashboard');
	}
})

//create posts routes

app.get('/create',(req,res)=>{
	if(!req.session.userId){
		res.render('login',{err:"il faut etre connecté"});
	}else{
	res.render('create.ejs');
		 }
})

app.post('/create',(req, res)=>{
	if(!req.session.userId){
		res.render('login',{err:"il faut etre connecté"});
	}else{
	let post={title:req.body.title, body:req.body.body, user_id:req.session.userId,user_name:req.session.username, autoris:"*"+req.session.userId+"*"};
	if(!post.title || !post.body){
		res.render('create',{err:"Remplire touts les champs"});
	}else{

	let sql = 'INSERT INTO posts SET ?';
	let query = db.query(sql, post, (err, result) => {
        if(err) throw err;
		res.render('dashboard',{success:'MEMO bien ajouté'});
	});
}
}
})

//permission routes

app.get('/permission/:id',(req, res)=>{
	if(!req.session.userId){
		res.render('login',{err:"il faut etre connecté"});
	}else{
	let sql="select * from users"
	let query=db.query(sql,(err,result)=>{
		if(err) throw err;
		res.render('permission',{result,id:req.params.id});
	})
}

})

app.post('/permissioned/:id',(req,res)=>{
	if(!req.session.userId){
		res.render('login',{err:"il faut etre connecté"});
	}else{
	var d;
	let per="";
	let perm ="*"+req.session.userId+"*";
		if(typeof req.body.choix != 'undefined'){
			(req.body.choix).forEach(val => {
				perm=perm+" *"+val+"*"; 	
				let s="SELECT * FROM users where id = ?"
				let q=db.query(s,val,(er,rs)=>{
					if(er) throw er;
					let s2= 'UPDATE users SET autoris = ? where id ='+val;
					let q2=db.query(s2,rs[0].autoris+"*"+req.params.id+"* ",(ers,rss)=>{
						if (ers) throw ers;		
						
					})
					
				})
				
			});}else{
				res.send('pas de valeurs');
			}
		let sql="UPDATE posts SET autoris = ? WHERE id ="+req.params.id
		let query=db.query(sql,perm,(err, result)=>{
			if (err) throw err;
			let sql = "SELECT * FROM posts WHERE autoris LIKE '%*?*%' ";
			let query =db.query(sql,req.session.userId,(err , result) => {
				if (err) throw err;
				
				if(result[0]){
					
				let sql2= "SELECT * FROM users WHERE id = ? "
				let query2 =db.query(sql2, result[0].user_id,(er , ress) => {
					
					res.render('posts', {p:result,name:ress[0].nom,success:'autorisation donées'});
				})		
				   }
				else{
					res.render('posts',{success:'autorisation données'});
				}
		
			})
		})
	}
})


//posts routes

app.get('/posts',(req, res)=>{
	if(!req.session.userId){
		res.render('login',{err:"vous devez etre connecté"});
	}else{
	let sql = "SELECT * FROM posts WHERE autoris LIKE '%*?*%' ";
	let query =db.query(sql,req.session.userId,(err , result) => {
		if (err) throw err;
		
		if(result[0]){
			
		let sql2= "SELECT * FROM users WHERE id = ? "
		let query2 =db.query(sql2, result[0].user_id,(er , ress) => {
			
			res.render('posts.ejs', {p:result,name:ress[0].nom});
		})		
	       }
		else{
			res.render('posts.ejs');
		}

	})
}

})


app.get('/posts/:id',(req, res)=>{
	if(!req.session.userId){
		res.render('login',{err:"il faut etre connecté"});
	}else{	
	let sql = "SELECT * FROM posts WHERE id = ?"
	let t=1;
	let query=db.query(sql,req.params.id,(err,result)=>{
		if(err) throw err;
		
		let s="SELECT * FROM users WHERE autoris LIKE '"+"%*"+req.params.id+"*%'"
		let q = db.query(s,(er,rs)=>{	
			
		if(result[0]){
		
		if(result[0].user_id != req.session.userId){
			t=0;
		}
		res.render('post',{ress:result,rs:rs,t});
	}else{
		res.render('post',{ress:result,rs:rs,t});
	}
	})
	})
}

})

//delete root

app.get('/delete/:id',(req, res)=>{
	if(!req.session.userId){
		res.render('login',{err:"vous devez etre connecté"});
	}else{
		let sql = "DELETE FROM posts WHERE id = ?"
		let query=db.query(sql,req.params.id,(err,result)=>{
			if (err) throw err;

			let sql = "SELECT * FROM posts WHERE autoris LIKE '%*?*%' ";
			let query =db.query(sql,req.session.userId,(err , result) => {
				if (err) throw err;
				
				if(result[0]){
				
				let sql2= "SELECT * FROM users WHERE id = ? "
				let query2 =db.query(sql2, result[0].user_id,(er , ress) => {
				
				res.render('posts.ejs', {p:result,name:ress[0].nom,success:'Memo bien suprimé'});
				})		
	       		}
				else{
					res.render('posts.ejs');
					}

	})
			
		})
	}
})

//update root

app.get('/update/:id',(req,res)=>{
	if(!req.session.userId){
		res.render('login',{err:'vous devez etre connecté'});
	}else{
		let sql = "SELECT * FROM posts WHERE id = "+req.params.id;
		let query=db.query(sql,(err,data)=>{
			if (err) throw err;
			var k = data[0];
			if(typeof data !=undefined){
				res.render('update',{
					id:req.params.id,
					title:k["title"],
					body:k["body"]
				})

			}
		})
	}
})

app.post('/updated/:id',(req,res)=>{
	let sql="UPDATE posts SET title = '"+req.body.title+"' , body = ?  WHERE id ="+req.params.id
    let query=db.query(sql,req.body.body,(err,result)=>{
		if(err) throw err;
		
		let sql = "SELECT * FROM posts WHERE autoris LIKE '%*?*%' ";
		let query =db.query(sql,req.session.userId,(err , result) => {
		if (err) throw err;

		if(result[0]){
		
		let sql2= "SELECT * FROM users WHERE id = ? "
		let query2 =db.query(sql2, result[0].user_id,(er , ress) => {
			
			res.render('posts.ejs', {p:result,name:ress[0].nom,success:'Memo bien modifié'});
		})		
	       }
		else{
			res.render('posts.ejs');
		}

	})
		
	})

})

//login routes

app.get('/login',(req, res)=>{
	if(!req.session.userId){
	res.render('login.ejs');}
	else{
		res.render('dashboard',{success:"vous etes deja connecté"});
	}
})

app.post('/logined',(req, res)=>{
	if(!req.session.userId){
	let sql = "SELECT * FROM users WHERE mail = ? ";
    let query = db.query(sql, req.body.mail, (err, result) => {
		
		if(!result.length){
			res.render('login',{err:"utilisateur inconnue"});
		}else{
		if(!bcrypt.compareSync(req.body.password, result[0].password)){
			res.render('login',{err:"mot de passe incorrect"});
		}else{
			req.session.userId=result[0].id;
			req.session.username=result[0].nom;
			req.session.save();
			res.render('dashboard',{success:"vous etes bien connecté" });
		}
	}
	});
}else{
	res.render('dashboard',{success:"vous etes déja connecté"});
}
});

//dasgboard root
app.get('/dashboard',(req, res)=>{
	if(!req.session.userId){
		res.render('login',{err:"il faut etre connecté"});
	}else{
	let sql = "SELECT * FROM users WHERE id = ? ";
	let query = db.query(sql, req.session.userId, (err, result) => {
			if(err) throw err;
			
			res.render('dashboard.ejs',);

	});
   }
});

//register routes

app.get('/register',(req, res)=>{
	res.render('register.ejs');
})

app.post('/registered',(req, res)=>{
	let user = {nom:req.body.nom, prenom:req.body.prenom, user_name:req.body.username, mail:req.body.mail, password:bcrypt.hashSync(req.body.password, null, null),autoris:"" };
	const { nom, prenom, username, mail, password, password2 } = req.body;
	let errors = [];
    
    if(!nom || !prenom || !mail || !username ||!password){
		errors.push({ msg: 'Remplire touts les champs' });
	} 

    let sq ="SELECT COUNT(*) AS cnt FROM users where mail = ?"
	let q = db.query(sq,req.body.mail,(er,data)=>{
		
		if(er) throw er;
		if(data[0].cnt > 0){
			
			errors.push({ msg: 'adresse mail deja utilisé' });
		} 

	if (password.length < 6) {
		errors.push({ msg: 'Le mot de passe doit comporter minimum 6 characters' });
	  }

	if(password!=password2){
		errors.push({ msg: 'Les mots de passe sont differents' });
	}  


	console.log(errors);

	if (errors.length > 0) {
		res.render('register',{
		  errors,
		  nom,
		  prenom,
		  username,
		  mail,
		  password,
		  password2
		});

	  }else{
	  

	let sql = 'INSERT INTO users SET ?';
	let query = db.query(sql, user, (err, result) => {
        if(err) throw err;
        
		res.render('login',{success:"vous étes bien inscrit connectez vous"});
	});

}

})

})

//recherche root

app.post('/recherche',(req,res)=>{
		
		let sql="SELECT * FROM posts WHERE autoris LIKE '%*"+req.session.userId+"*%' and body LIKE '%"+req.body.cle+"%'"
		let query=db.query(sql,(err,result)=>{
			
			
			if(err) throw err;
			res.render('posts',{p:result});
		})

})

//logout root 

app.get('/logout',(req, res)=>{
	if(!req.session.userId){
		res.render('login',{err:"Vous n'etes pas connecté"});
	}else{
	req.session.destroy(err => {
		res.render('login',{success:" vous etes bien déconnecté"});
	  })
	}

})

app.listen(5000);
