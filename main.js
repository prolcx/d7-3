//import express
const express = require('express')
const handlebars = require('express-handlebars')

//import mysql promise
const mysql = require('mysql2/promise')

//configuring port
const PORT = parseInt(process.argv[0]) || parseInt(process.env.PORT) || 3000

//create the data pool connection
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'leisure50',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 4,
    timezone: '+08:00'
})

//SQL
const SQL_GET_TV_SHOWS = 'select * from leisure.tv_shows where tvid < ? ORDER BY name DESC limit ?'
const SQL_CHOSEN_TV_SHOW = 'select * from leisure.tv_shows where tvid = ?'

//SQL startup
const startApp = async (app, pool) => {

    try {
        const conn = await pool.getConnection();
        console.info('Pinging database...')
        await conn.ping()

        conn.release()

        app.listen(PORT, ()=>{
            console.info(`Application started at ${PORT} at ${new Date()}`)
        })
    } catch(e){
        console.error('Cannot ping database: ', e)
    }

}

//instance for express
const app = express()

//configure handlebars
app.engine('hbs', handlebars({defaultLayout:'default.hbs'}))
app.set('view engine', 'hbs')

//application
//get landing page
app.get('/', async (req,resp)=>{

    const conn = await pool.getConnection()
    try {
        const result = await conn.query(SQL_GET_TV_SHOWS, [21, 20])
        console.info(result[0])

    
    resp.status(200)
    resp.type('text/html')
    resp.render('index', { tvShow:result[0] })
    } catch(e) {
        resp.status(500)
        resp.type('text/html')
        resp.send(JSON.stringify(e))
    } finally {
        conn.release()
    }
})

//get to detail page
app.get('/tv_shows/:tvid', async (req,resp)=>{
    const tvid = req.params['tvid']
    const conn = await pool.getConnection()
    try {
        const result = await conn.query(SQL_CHOSEN_TV_SHOW, [tvid])
        console.info(result[0])

    
    resp.status(200)
    resp.type('text/html')
    resp.render('detail', { tvShowList:result[0] })
    } catch(e) {
        resp.status(500)
        resp.type('text/html')
        resp.send(JSON.stringify(e))
    } finally {
        conn.release()
    }
})

app.use(express.static(__dirname + '/views'))


//start server
pool.getConnection()
.then( conn =>{
    console.info('Pinging Database...')
    const p0 = Promise.resolve(conn)
    const p1 = conn.ping()
    return Promise.all([p0,p1])
})
.then(result =>{
    const conn = result[0]
    conn.release()
    app.listen(PORT, () =>{
        console.info(`Application started at ${PORT} at ${new Date()}`)
    })
}).catch(e=>{
    console.error('Cannot start server: ',e)
})