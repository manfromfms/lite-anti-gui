const Database = require("@replit/database")
var db

const fs = require('fs')

var main = async () => {
    var users_db = await db.get("users")

    //console.log(users_db)
    const users = JSON.parse(users_db)
    console.log(`Loaded ${Object.keys(users).length} users`)


    // Init scripts
    const { PuzzlesAPI } = require("./puzzles-database/puzzles")
    var puzzles = new PuzzlesAPI(users)


    // Init server
    const express = require('express')
    const app = express()
    const http = require('http')
    const server = http.createServer(app)
    const { Server } = require("socket.io")
    const io = new Server(server)

    app.use(express.json())

    // Main page
    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/client/index.html')
    }).get('/script.js', (req, res) => {
        res.sendFile(__dirname + '/client/script.js')
    }).get('/AbChess-0.3.1.js', (req, res) => {
        res.sendFile(__dirname + '/client/abchess/AbChess/AbChess-0.3.1.js')
    }).get('/AbChess-0.3.1.css', (req, res) => {
        res.sendFile(__dirname + '/client/abchess/AbChess/AbChess-0.3.1.css')
    }).get('/images/wikipedia/:name', (req, res) => {
        res.sendFile(__dirname + `/client/abchess/images/wikipedia/${req.params.name}`)
    }).get('/img/chesspieces/wikipedia/:name', (req, res) => {
        res.sendFile(__dirname + `/client/abchess/images/wikipedia/${req.params.name.toLowerCase()}`)
    }).get('/favicon_dark_theme.ico', (req, res) => {
        res.sendFile(__dirname + `/client/tabler_chess-rook_dark.png`)
    }).get('/favicon_light_theme.ico', (req, res) => {
        res.sendFile(__dirname + `/client/tabler_chess-rook_light.png`)
    })

    // Puzzle page
    app.get('/puzzle/:id', (req, res) => {
        res.sendFile(__dirname + '/client/index.html')
    }).get('/puzzle/img/chesspieces/wikipedia/:name', (req, res) => {
        res.sendFile(__dirname + `/client/abchess/images/wikipedia/${req.params.name.toLowerCase()}`)
    })

    // From-rage page
    app.get('/from-range/:range', (req, res) => {
        res.sendFile(__dirname + '/client/index.html')
    }).get('/from-range/img/chesspieces/wikipedia/:name', (req, res) => {
        res.sendFile(__dirname + `/client/abchess/images/wikipedia/${req.params.name.toLowerCase()}`)
    })

    // Flow page
    app.get('/flow/', (req, res) => {
        res.sendFile(__dirname + '/client/flow/index.html')
    }).get('/flow/script.js', (req, res) => {
        res.sendFile(__dirname + '/client/flow/script.js')
    }).get('/flow/img/chesspieces/wikipedia/:name', (req, res) => {
        res.sendFile(__dirname + `/client/abchess/images/wikipedia/${req.params.name.toLowerCase()}`)
    })

    // Flow from-range page
    app.get('/flow/from-range/:range', (req, res) => {
        res.sendFile(__dirname + '/client/flow/index.html')
    }).get('/flow/from-range/img/chesspieces/wikipedia/:name', (req, res) => {
        res.sendFile(__dirname + `/client/abchess/images/wikipedia/${req.params.name.toLowerCase()}`)
    })

    // Info page
    app.get('/info', (req, res) => {
        res.sendFile(__dirname + '/client/info/index.html')
    })

    // API
    app.post('/get-db-key', (req, res) => {
        if(res.body.token === process.env['db_key']) res.json(process.env['REPLIT_DB_URL'])
        else res.json({"error": "Access denied"})
    })

    var onlineCounter = 0

    /*

    Categories:
        1 - Opening
        2 - Middlegame
        3 - Endgame
        4 - Cleaning
        5 - Promotion cleaning
        6 - Win by tempo
        7 - Queen race
        8 - Intermediate
        9 - Zugzwang
        10 - Short (2-4 moves)
        11 - Long (5-10 moves)

    TODO: API
    TODO: Opening info

     */

    // User bridge
    io.on('connection', async (socket) => {
        /*for(let i = 0; i < 5; i++) {
            socket.emit("puzzle-data", puzzles.get())
        }*/

        var userHash = ''
        var lastRequest = 0

        var range = {
            start: 0,
            end: 1000000,
        }

        onlineCounter++
        io.sockets.emit('update-online-counter', onlineCounter)

        socket.on('disconnect', () => {
            io.sockets.emit('update-online-counter', onlineCounter)
            onlineCounter--
        })

        var path = socket.handshake.headers.referer.split("/").slice(3)

        if(path.length === 2) {
            if(path[0] === 'from-range') {
                var start = path[1].split('-')[0]
                var end = path[1].split('-')[1]

                if(start == Number(start) && end == Number(end)) {
                    range.start = Number(start)
                    range.end = Number(end)
                }
            }
        } else if(path.length === 3) {
            if(path[0] === 'flow' && path[1] === 'from-range') {
                var start = path[2].split('-')[0]
                var end = path[2].split('-')[1]

                if(start == Number(start) && end == Number(end)) {
                    range.start = Number(start)
                    range.end = Number(end)
                }
            }
        }

        socket.on('get-info-page-data', () => {
            socket.emit('info-page-data', {
                puzzles: puzzles.puzzles.length,
            })
        })

        socket.on("flow-with-hash", hash => {
            userHash = hash
            if(!users[userHash]) {
                users[userHash] = {
                    rated: [],
                    categorized: []
                }
            }

            setTimeout(() => {
                socket.emit('flow-data', puzzles.get(users[userHash], 1, range)[0])
            }, 1000)
        })

        socket.on("login-with-hash", hash => {
            userHash = hash
            if(!users[userHash]) {
                users[userHash] = {
                    rated: [],
                    categorized: []
                }
            }

            var array = puzzles.get(users[userHash], 5, range)

            for(let i in array) socket.emit('puzzle-data', array[i])
        })

        socket.on("new-flow", () => {
            if(userHash.length === 0) return

            socket.emit('flow-data', puzzles.get(users[userHash], 1, range)[0])
        })

        socket.on("ping-with-hash", hash => {
            userHash = hash
            if(!users[userHash]) {
                users[userHash] = {
                    rated: [],
                    categorized: []
                }
            }
        })

        socket.on('login-with-hash-puzzle-id', data => {
            userHash = data.user_id
            if(!users[data.user_id]) {
                users[data.user_id] = {
                    rated: [],
                    categorized: []
                }
            }

            socket.emit('puzzle-data', puzzles.getById(Number(data.puzzle_id)))
        })

        socket.on('get-puzzle-by-id', id => {
            socket.emit('puzzle-data', puzzles.getById(id))
        })

        socket.on('new-portion', () => {
            if(userHash.length === 0) return

            var array = puzzles.get(users[userHash], 5, range)

            for(let i in array) socket.emit('puzzle-data', array[i])
        })

        socket.on('get-best-unrated', () => {
            if(userHash.length === 0) return

            if(Date.now() - lastRequest < 500) return

            lastRequest = Date.now()

            var array = puzzles.getBestUnrated(users[userHash])

            for(let i in array) socket.emit('puzzle-data', array[i])
        })

        socket.on("rate-puzzle", data => {
            if(userHash.length === 0) return

            if(data.length !== 2 || userHash.length === 0) return

            var id = data[0]
            var rate = data[1]

            if(Number(rate) < 1 || Number(rate) > 5 || Math.floor(Number(rate)) !== Number(rate)) return

            if(!puzzles.ifRated(users[userHash], {id: Number(id)})) users[userHash].rated.push({
                id: Number(id),
                rate: Number(rate),
            })

            puzzles.users = users

            console.log("New rating for", id, puzzles.getPuzzleRating(id))

            save(users, '/data/users.json', users_key)
        })

        socket.on('puzzle-category', (data) => {
            if(userHash.length === 0) return

            if(!data) return
            if(!data.puzzle_id) return
            if(!data.category) return

            data.category = Number(data.category)

            if(Math.floor(data.category) !== data.category || data.category < 1 || data.category > 11) return

            if(!users[userHash].categorized) {
                users[userHash].categorized = []
            }

            if(!puzzles.ifCategorized(users[userHash], {id: data.puzzle_id})) {
                users[userHash].categorized.push({
                    id: Number(data.puzzle_id),
                    categories: {
                        "1": 0,
                        "2": 0,
                        "3": 0,
                        "4": 0,
                        "5": 0,
                        "6": 0,
                        "7": 0,
                        "8": 0,
                        "9": 0,
                        "10": 0,
                        "11": 0,
                    }
                })
            }

            for(let i in users[userHash].categorized) {
                if(users[userHash].categorized[i].id === data.puzzle_id) {
                    users[userHash].categorized[i].categories["" + data.category] = 1
                }
            }

            puzzles.users = users

            console.log("New category for", data.puzzle_id, puzzles.getPuzzleCategory(data.puzzle_id))

            save(users, '/data/users.json', users_key)
        })

        socket.on('get-puzzles-by-category', (type) => {
            if(userHash.length === 0) return

            if(Date.now() - lastRequest < 500) return

            lastRequest = Date.now()

            var array = puzzles.getCategorizedUnrated(users[userHash], type)

            for(let i in array) socket.emit('puzzle-data', array[i])
        })
    })

    setInterval(() => {
        db.set("users", JSON.stringify(users))
    }, 10000)

    // More stuff
    server.listen(3000, () => {
        console.log('listening on *:3000')
    })
}

// Connect to database
if(fs.readdirSync(__dirname + '/').includes('private.json')) {
    console.log('Loading database from cloud')
    
    const axios = require('axios');

    const data = require('./private.json')

    axios.post('https://long-double.com/get-db-key', data)
        .then(res => {
            console.log('Database loaded successfully')
            db = new Database(res.data)
            main()
        })
        .catch(err => {
            console.error(err)
        })
} else {
    console.log('Loading local database')
    db = new Database()
    main()
}