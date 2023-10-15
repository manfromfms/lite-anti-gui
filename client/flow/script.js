// Load HTML elements
var puzzle = document.getElementById('puzzle-data')
var lichess_puzzle = document.getElementById('lichess-iframe')

// Update online counter
socket.on('update-online-counter', num => {
    document.getElementById('online-counter').innerHTML = `Online: ${num}`
})

// Load user id
if(!localStorage['user_id']) {
    localStorage['user_id'] = hash(Math.random() + '') + '_' + prompt('Write your nickname please')
}

setInterval(() => {
    socket.emit('ping-with-hash', localStorage['user_id'])
}, 2000)

socket.emit('flow-with-hash', localStorage['user_id'])

// Get data from flow
socket.on('flow-data', data => {
    puzzle.innerHTML = ''

    if(Object.keys(data).length === 0) return

    var starString = ''
    var tempRate = data.rate
    while(data.rate >= 1) {
        starString += fullStar
        data.rate -= 1
    }
    if(data.rate >= 0.5) starString += halfStar

    puzzle.insertAdjacentHTML('beforeend', `
        <div class="chess-puzzle-data">
            <div class="chess-container" id="chessboard-${data.id}" onclick="window.open('${data.link}')" title="Click to open puzzle"></div>
            <p class="puzzle-info puzzle-id" title="Id of puzzle in database">Id: ${data.id} <img title="Copy link" src="https://cdn3.iconfinder.com/data/icons/essential-2-glyph/32/_Friend_link_share-512.png" width="14px" onclick="navigator.clipboard.writeText(window.location.href.split('/')[0] + '/' + window.location.href.split('/')[1] + '/' + window.location.href.split('/')[2] + '/puzzle/' + ${data.id});"></p>
            <p class="puzzle-info puzzle-elo" title="Average elo of two players from original game">Elo: ${Math.round(data.elo)}</p>
            <p class="puzzle-info puzzle-elo" title="Users ratings: ${tempRate}">${starString}</p>
            <p class="puzzle-info puzzle-original" title="Open an original game of this puzzle"><a href="${data.site}">Original game</a></p>
            
            <div class="rate-puzzle" id="${data.id}_rate_puzzle" title="Rate how much did you like this puzzle">
                <span class="rate-option-start rate-option" id="${data.id}+1" onclick="applyRating(this)">1</span>
                <span class="rate-option-middle rate-option" id="${data.id}+2" onclick="applyRating(this)">2</span>
                <span class="rate-option-middle rate-option" id="${data.id}+3" onclick="applyRating(this)">3</span>
                <span class="rate-option-middle rate-option" id="${data.id}+4" onclick="applyRating(this)">4</span>
                <span class="rate-option-end rate-option" id="${data.id}+5" onclick="applyRating(this)">5</span>
            </div>
        </div>
    `)

    lichess_puzzle.innerHTML = `<iframe src="${data.link}"></iframe>`

    const config = {
        draggable: false,
        position: data.fen,
    }

    var board = Chessboard(`chessboard-${data.id}`, config)
    if(data.fen.split(" ")[1] === 'b') board.flip()
})

var applyRating = (elem) => {
    console.log(elem.id)

    document.getElementById(`${elem.id.split('+')[0]}_rate_puzzle`).innerHTML = ''

    socket.emit('rate-puzzle', elem.id.split('+'))
    socket.emit('new-flow')
}
