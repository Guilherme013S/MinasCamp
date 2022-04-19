const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const ejsMate = require('ejs-mate')
const session = require('express-session')
const flash = require('connect-flash')
const ExpressError = require('./utils/ExpressError')
const methodOverride = require('method-override')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const User = require('./models/user')

const usersRoutes = require('./routes/user')
const campgroundsRoutes = require('./routes/campgrounds')
const reviewsRoutes = require('./routes/reviews')

mongoose.connect('mongodb://localhost:27017/minas-camp')
const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', () => {
  console.log('Database connected')
})

const app = express()

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))

const configSession = {
  secret: 'momspaguetty',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}

app.use(session(configSession))
app.use(flash())

app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

//flash middleware
app.use((req, res, next) => {
  res.locals.currentUser = req.user
  res.locals.message = req.flash('success')
  res.locals.error = req.flash('error')
  next()
})

app.use('/', usersRoutes)
app.use('/campgrounds', campgroundsRoutes)
app.use('/campgrounds/:id/reviews', reviewsRoutes)

app.get('/', (req, res) => {
  res.render('home')
})

app.all('*', (req, res, next) => {
  next(new ExpressError('Page not Found', 404))
})

app.use((err, req, res, next) => {
  const { status = 500 } = err
  if (!err.message) err.message('Oh No, Something went wrong')
  res.status(status).render('error', { err })
})

app.listen(3000, () => {
  console.log('APP RUNNING ON PORT 3000')
})