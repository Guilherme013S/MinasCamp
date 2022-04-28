if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

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
const mongoSanitize = require('express-mongo-sanitize')
const usersRoutes = require('./routes/user')
const campgroundsRoutes = require('./routes/campgrounds')
const reviewsRoutes = require('./routes/reviews')
const MongoStore = require('connect-mongo')

const dbUrl = process.env.DB.URL || 'mongodb://localhost:27017/minas-camp'

mongoose.connect(dbUrl)
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
app.use(
  mongoSanitize({
    replaceWith: '_',
  })
)

const secret = process.env.SECRET || 'deveriaserumsegredomaismelhor'

const store = new MongoStore({
  mongoUrl: dbUrl,
  secret,
  touchAfter: 24 * 60 * 60,
})

store.on('error', function (e) {
  console.log('SESSION STORE ERROR', e)
})

const configSession = {
  store: store,
  name: 'MinasCamp',
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure: true,
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

//session middleware tbm fica os flash
app.use((req, res, next) => {
  // console.log(req.session)
  // console.log(req.query)
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
  if (!err.message) err.message = 'Oh No, Something went wrong'
  res.status(status).render('error', { err })
})

app.listen(3000, () => {
  console.log('APP RUNNING ON PORT 3000')
})
