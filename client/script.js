const chessArray = document.getElementById('chess-array')

const inputId = document.getElementById('by-id')

const fullStar = '<img src="data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2072%2072%22%3E%3Cpath%20fill%3D%22%23FCEA2B%22%20d%3D%22M35.993%2010.736L27.791%2027.37L9.439%2030.044l13.285%2012.94l-3.128%2018.28l16.412-8.636l16.419%208.624l-3.142-18.278l13.276-12.95l-18.354-2.66z%22%3E%3C%2Fpath%3E%3Cpath%20fill%3D%22none%22%20stroke%3D%22%23000%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-miterlimit%3D%2210%22%20stroke-width%3D%222%22%20d%3D%22M35.993%2010.736L27.791%2027.37L9.439%2030.044l13.285%2012.94l-3.128%2018.28l16.412-8.636l16.419%208.624l-3.142-18.278l13.276-12.95l-18.354-2.66z%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E" class="full-star star">'
const halfStar = '<img src="data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2072%2072%22%3E%3Cpath%20d%3D%22m35%2011l9.209%2015.87l18.352%202.674l-13.285%2012.94l3.128%2018.28L35%2052.5V11Z%22%3E%3C%2Fpath%3E%3Cpath%20fill%3D%22%23FCEA2B%22%20d%3D%22m37%2011.5l-9.209%2015.87L9.44%2030.044l13.285%2012.94l-3.128%2018.28L37%2052V11.5Z%22%3E%3C%2Fpath%3E%3Cpath%20fill%3D%22%233F3F3F%22%20d%3D%22m35%2011l9.209%2015.87l18.352%202.674l-13.285%2012.94l3.128%2018.28L35%2052.5V11Z%22%3E%3C%2Fpath%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%23000%22%20stroke-linecap%3D%22round%22%20stroke-width%3D%222%22%3E%3Cpath%20stroke-linejoin%3D%22round%22%20stroke-miterlimit%3D%2210%22%20d%3D%22M35.993%2010.736L27.79%2027.37L9.44%2030.044l13.285%2012.94l-3.128%2018.28l16.412-8.636l16.419%208.623l-3.142-18.277l13.276-12.95l-18.354-2.66l-8.214-16.628Z%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M36%2011.5V49%22%3E%3C%2Fpath%3E%3C%2Fg%3E%3C%2Fsvg%3E" class="half-star star">'

const setup = () => {
    var href = window.location.href.split('/')
    if(href.length > 3) {
        // Check if link to puzzle with id
        if(href.length === 5) {
            if(href[3] === 'puzzle') {
                socket.emit('login-with-hash-puzzle-id', { user_id: localStorage['user_id'], puzzle_id: Number(href[4])})
                return
            }
        }

        socket.emit('login-with-hash', localStorage['user_id'])
    }
}


inputId.addEventListener('keypress', (event) => {
    if(event.key === "Enter") {
        if(inputId.value.length === 0) return
        chessArray.innerHTML = ''
        socket.emit('get-puzzle-by-id', Number(inputId.value))
        inputId.value = ''
    }
})

function hash(string) {
    var hash = 0;
    if (string.length == 0) return hash;
    for (i = 0; i < string.length; i++) {
        ch = string.charCodeAt(i);
        hash = ((hash << 5) - hash) + ch;
        hash = hash & hash;
    }
    return hash;
}

var getNew = () => {
    chessArray.innerHTML = ''
    socket.emit('new-portion')
}

var getBestUnrated = () => {
    chessArray.innerHTML = ''
    socket.emit('get-best-unrated')
}


if(!localStorage['user_id']) {
    localStorage['user_id'] = hash(Math.random() + '') + '_' + prompt('Write your nickname please')
}


setInterval(() => {
    socket.emit('ping-with-hash', localStorage['user_id'])
}, 2000)


var applyCategory = (elem) => {
    var puzzleId = Number(elem.id.split("+")[0])
    var category = Number(elem.value)

    elem.value = 0

    console.log(puzzleId, category)

    socket.emit('puzzle-category', {
        puzzle_id: puzzleId,
        category: category
    })
}

var applyRating = (elem) => {

    document.getElementById(`${elem.id.split('+')[0]}_rate_puzzle`).innerHTML = `
        <select id="${elem.id}_categories_select" title="Choose a set of categories this puzzle fits into" class="choose-category" onchange="applyCategory(this)">
            <option value="0" selected>Choose categories</option>
            <option value="1" title="Puzzle started from opening phase">Opening</option>
            <option value="2" title="Puzzle started from middle phase">Middlegame</option>
            <option value="3" title="Puzzle started from end phase">Endgame</option>
            <option value="4" title="Perform a cleaning">Cleaning</option>
            <option value="5" title="Pawn promotion cleaning">Promotion cleaning</option>
            <option value="6" title="Win by getting a tempo advantage">Win by tempo</option>
            <option value="7" title="Queen race">Queen race</option>
            <option value="8" title="Intermediate move">Intermediate</option>
        </select>
    `

    socket.emit('rate-puzzle', elem.id.split('+'))
}

var loadPuzzlesByCat = (type) => {
    socket.emit('get-puzzles-by-category', type)

    chessArray.innerHTML = ''
}

socket.on("puzzle-data", (data) => {
    console.log(data)
    if(Object.keys(data).length === 0) return

    const config = {
        draggable: false,
        position: data.fen,
    }

    var starString = ''
    var tempRate = data.rate
    while(tempRate >= 1) {
        starString += fullStar
        tempRate -= 1
    }
    if(tempRate >= 0.5) starString += halfStar

    if(data.rate === 0) starString = ''

    catStr = `Opening: ${Math.floor(data.categories["1"] * 100)}%\nMiddlegame: ${Math.floor(data.categories["2"] * 100)}%\nEndgame: ${Math.floor(data.categories["3"] * 100)}%\nCleaning: ${Math.floor(data.categories["4"] * 100)}%\nPromotion cleaning: ${Math.floor(data.categories["5"] * 100)}%\nWin by tempo: ${Math.floor(data.categories["6"] * 100)}%\nQueen race ended: ${Math.floor(data.categories["7"] * 100)}%\nQueen race stopped: ${Math.floor(data.categories["8"] * 100)}%\nIntermediate: ${Math.floor(data.categories["9"] * 100)}%\n`

    /*
        <p class="puzzle-info puzzle-elo" title="Users ratings">Rating: ${Math.round(data.rate*100)/100}</p>
     */

    chessArray.insertAdjacentHTML('beforeend', `
        <div class="chess-puzzle-data">
            <div class="chess-container" id="chessboard-${data.id}" title="Click to open puzzle" onclick="window.open('${data.link}')"></div>
            <p class="puzzle-info puzzle-id" title="Id of puzzle in database">Id: ${data.id} <img title="Copy link" src="https://cdn3.iconfinder.com/data/icons/essential-2-glyph/32/_Friend_link_share-512.png" width="14px" onclick="navigator.clipboard.writeText(window.location.href.split('/')[0] + '/' + window.location.href.split('/')[1] + '/' + window.location.href.split('/')[2] + '/puzzle/' + ${data.id});"></p>
            <p class="puzzle-info puzzle-elo" title="Average elo of two players from original game">Elo: ${Math.round(data.elo)}</p>
            <p class="puzzle-info puzzle-elo" title="Users ratings: ${data.rate}">${starString}</p>
            <p class="puzzle-info puzzle-original" title="Open an original game of this puzzle"><a href="${data.site}">Original game</a></p>
            <p class="puzzle-info puzzle-cats" title="Click me to get this puzzle's categories" onclick="alert(\`${catStr}\`)">Categories</p>
            
            <div class="rate-puzzle" id="${data.id}_rate_puzzle">
                <span class="rate-option-start rate-option" id="${data.id}+1" onclick="applyRating(this)" title="Rate how much did you like this puzzle">1</span>
                <span class="rate-option-middle rate-option" id="${data.id}+2" onclick="applyRating(this)" title="Rate how much did you like this puzzle">2</span>
                <span class="rate-option-middle rate-option" id="${data.id}+3" onclick="applyRating(this)" title="Rate how much did you like this puzzle">3</span>
                <span class="rate-option-middle rate-option" id="${data.id}+4" onclick="applyRating(this)" title="Rate how much did you like this puzzle">4</span>
                <span class="rate-option-end rate-option" id="${data.id}+5" onclick="applyRating(this)" title="Rate how much did you like this puzzle">5</span>
            </div>
        </div>
        
    `)

    var board = Chessboard(`chessboard-${data.id}`, config)

    if(data.fen.split(" ")[1] === 'b') board.flip()
})

socket.on('update-online-counter', num => {
    document.getElementById('online-counter').innerHTML = `Online: ${num}`
})

setup()
