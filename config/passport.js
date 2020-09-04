const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');


module.exports = function(passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'mail' }, (mail, password, done) => {
      // Match user
      let sql = `SELECT password FROM users WHERE mail = ${mail}`;
      let query = db.query(sql, (err, result) => {
        if(err) throw err;
        console.log(result);
      });

      if(!query){
        return done(null, false, { message: 'That email is not registered' });
      }

        // Match password
        bcrypt.compare(password, query , (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Password incorrect' });
          }
  
    });
    })
  );

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  })

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
};