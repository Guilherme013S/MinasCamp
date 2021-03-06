const User = require('../models/user')

module.exports.registerForm = (req, res) => {
  res.render('users/register')
}
module.exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body
    const user = new User({ username, email })
    const registerdUser = await User.register(user, password)
    req.login(registerdUser, (err) => {
      if (err) return next(err)
      req.flash('success', 'Usuario registrado com successo')
      res.redirect('/campgrounds')
    })
  } catch (error) {
    req.flash('error', error.message)
    res.redirect('/register')
  }
}

module.exports.loginForm = (req, res) => {
  res.render('users/login')
}

module.exports.login = (req, res) => {
  req.flash('success', 'Login successfuly')
  //pega o ultimo caminho que foi salvo em "middleware" se n tiver volta para campgrounds
  const caminho = req.session.returnTo || 'campgrounds'
  delete req.session.returnTo
  res.redirect(caminho)
}

module.exports.logout = (req, res) => {
  req.logout()
  req.flash('success', 'goodbye')
  res.redirect('/campgrounds')
}
