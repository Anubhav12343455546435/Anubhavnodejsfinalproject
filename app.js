const express = require('express');
const app = express();
const port = 3000;
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const User = require('./models/user'); 

mongoose.connect('mongodb+srv://groupproject:groupproject@cluster0.ekuwd58.mongodb.net/?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true })); 

app.use(session({
    secret: 'your-secret-key', // Replace with a random security key
    resave: false,
    saveUninitialized: true,
}));

// Set the 'user' variable before the home route
app.get('/', (req, res) => {
    let user = null; // Set 'user' to null by default
    if (req.session.user) {
        // If the user is logged in, set 'user' to the user information
        user = req.session.user;
    }
    res.render('home', { user }); // Pass the 'user' variable to the home template
});


app.get('/home', (req, res) => {
    res.render('home', { user });
});

app.get('/', (req, res) => {
    res.render('home'); 
});

app.get('/users', (req, res) => {
    res.render('users'); 
});

app.get('/surveys', async (req, res) => {
    try {
        const surveys = await Survey.find(); // Retrieve survey data from the database

        // Get the login user's information if the user is logged in
        const user = req.session.user;

        // Render the page and pass data, including the login user's information
        res.render('surveys', { surveys, user });
    } catch (err) {
        console.error(err);
        res.redirect('/'); // Handle errors by redirecting to the home page or an appropriate page
    }
});

app.get('/createsurvey', (req, res) => {
    res.render('createsurvey');
});

app.get('/login', (req, res) => {
    res.render('login', { user: req.session.user }); // Pass user information from the session to the template
});

// Handle login form submission
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.user = user; // Set user information in the session
            res.redirect('/surveys'); // Redirect to the home page after successful login
        } else {
            res.redirect('/login'); // Redirect to the login page if login fails
        }
    } catch (error) {
        console.error(error);
        res.redirect('/login'); // Redirect to the login page if login fails
    }
});

app.get('/register', (req, res) => {
    res.render('register');
});

// Handle registration form submission
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = new User({ username, password });
        await user.save();
        res.redirect('/login'); // Redirect to the login page after successful registration
    } catch (error) {
        console.error(error);
        res.redirect('/register'); // Redirect to the registration page if registration fails
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(); // Destroy the session
    res.redirect('/'); // Redirect to the home page after logout
});

const Survey = require('./models/survey'); 

app.post('/create-survey', async (req, res) => {
    const { title, question, answerFormat } = req.body;
    
    const newSurvey = new Survey({ title, question, answerFormat });
    try {
        await newSurvey.save();
        res.redirect('/surveys'); 
    } catch (err) {
        console.error(err);
        res.redirect('/'); 
    }
});

// 处理编辑调查页面
app.get('/editsurvey/:id', async (req, res) => {
    try {
        const survey = await Survey.findById(req.params.id); // 根据ID查找调查

        // 渲染编辑调查页面并传递调查数据
        res.render('editsurvey', { survey });
    } catch (err) {
        console.error(err);
        res.redirect('/surveys'); // 处理错误情况，重定向回调查列表页面
    }
});

// 处理编辑调查表单提交
app.post('/editsurvey/:id', async (req, res) => {
    try {
        const { title, question, answerFormat } = req.body;
        const surveyId = req.params.id;

        // 根据ID更新调查信息
        await Survey.findByIdAndUpdate(surveyId, { title, question, answerFormat });

        res.redirect('/surveys'); // 编辑成功后重定向回调查列表页面
    } catch (err) {
        console.error(err);
        res.redirect('/surveys'); // 处理错误情况，重定向回调查列表页面
    }
});

// 处理删除调查
app.get('/deletesurvey/:id', async (req, res) => {
    try {
        const surveyId = req.params.id;

        // 使用findByIdAndDelete来根据ID删除调查
        await Survey.findByIdAndDelete(surveyId);

        res.redirect('/surveys'); // 删除成功后重定向回调查列表页面
    } catch (err) {
        console.error(err);
        res.redirect('/surveys'); // 处理错误情况，重定向回调查列表页面
    }
});




app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
