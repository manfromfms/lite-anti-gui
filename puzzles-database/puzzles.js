class PuzzlesAPI {
    constructor(users) {
        this.puzzles = require("./puzzles.json")

        //this.puzzles = []

        this.users = users

        /*
        {
            rated: [{id: 1234, rate: 5}]
        }
         */

        /*var counter = 0
        for(let i in this.JSONList) {
            for(let j of this.JSONList[i].puzzles) {
                this.puzzles.push({
                    id: counter,
                    site: i,
                    fen: j,
                    link: `https://lichess.org/analysis/antichess/${j.replaceAll(" ", "_")}`,
                    elo: this.JSONList[i].rating
                })

                counter++
            }
        }*/
		
		console.log('Loaded', this.puzzles.length, 'puzzles')
    }

    ifRated(user, puzzle) {
        for(let i in user.rated) {
            if(user.rated[i].id === puzzle.id) return true
        }

        return false
    }

    ifCategorized(user, puzzle) {
        for(let i in user.categorized) {
            if(user.categorized[i].id === puzzle.id) return true
        }

        return false
    }

    recurrentSearchById(id, start, end) {
        if(start === end - 1) {
            if(this.puzzles[start].id === id) return this.puzzles[start]
            if(this.puzzles[end].id === id) return this.puzzles[end]

            return {id: -1}
        }

        var middle = Math.floor(start / 2 + end / 2)

        if(this.puzzles[middle].id > id) return this.recurrentSearchById(id, start, middle)
        return this.recurrentSearchById(id, middle, end)
    }

    getById(id) {
        id = Number(id)

        if(id >= this.puzzles[this.puzzles.length-1].id || id < 0) return {}

        var puzzle = this.recurrentSearchById(id, 0, this.puzzles.length - 1)

        if(puzzle.id !== id) return {}

        return {
            rate: this.getPuzzleRating(id),
            categories: this.getPuzzleCategory(id),
            ...puzzle
        }
    }

    getPuzzleRating(id) {
        var counter = 0
        var sum = 0

        for(let i in this.users) {
            for(let j in this.users[i].rated) {
                if(this.users[i].rated[j].id == id) {
                    counter++
                    sum += this.users[i].rated[j].rate
                    //console.log(this.users[i].rated[j].rate)
                }
            }
        }

        if(counter === 0) return 0
        return sum / counter
    }

    getPuzzleCategory(id) {
        var sum = 0

        var counters = {
            "1": 0,
            "2": 0,
            "3": 0,
            "4": 0,
            "5": 0,
            "6": 0,
            "7": 0,
            "8": 0,
            "9": 0,
        }

        for(let i in this.users) {
            for(let j in this.users[i].categorized) {
                if(this.users[i].categorized[j].id == id) {
                    for(let t in this.users[i].categorized[j].categories) {
                        counters[t] += this.users[i].categorized[j].categories[t]
                        sum += this.users[i].categorized[j].categories[t]
                    }
                }
            }
        }

        for(let t in counters) {
            counters[t] /= sum
        }

        return counters
    }

    get(user, amount, range) {
        var allowedPuzzles = []

        for(let i in this.puzzles) {
            i = Number(i)
            if(!this.ifRated(user, this.puzzles[i]) && ((range && this.puzzles[i].id >= range.start && this.puzzles[i].id <= range.end) || !range)) allowedPuzzles.push(this.puzzles[i])
        }

        if(allowedPuzzles.length === 0) return []

        var result = []
        while(amount-- && allowedPuzzles.length > 0) {
            var index= Math.floor(Math.random() * allowedPuzzles.length)

            result.push({
                rate: this.getPuzzleRating(allowedPuzzles[index].id),
                categories: this.getPuzzleCategory(allowedPuzzles[index].id),
                ...allowedPuzzles[index]
            })

            allowedPuzzles.splice(index, 1)

            //console.log(index, allowedPuzzles.length)
        }

        return result
    }

    getBestUnrated(user) {
        var ratedPuzzles = {}

        for(let i in this.users) {
            for(let j in this.users[i].rated) {
                if(!ratedPuzzles[this.users[i].rated[j].id] && this.puzzles[this.users[i].rated[j].id]) ratedPuzzles[this.users[i].rated[j].id] = {
                    ...this.puzzles[this.users[i].rated[j].id],
                    rate: this.getPuzzleRating(this.users[i].rated[j].id),
                    categories: this.getPuzzleCategory(this.users[i].rated[j].id),
                }
            }
        }

        var array = []
        for(let i in ratedPuzzles) {
            if(!this.ifRated(user, ratedPuzzles[i])) {
                array.push(ratedPuzzles[i])
            }
        }

        array = array.sort((a, b) => {return b.rate - a.rate})

        array = array.slice(0, 5)

        return array
    }

    getCategorizedUnrated(user, type) {
        var categorizedPuzzles = {}

        for(let i in this.users) {
            for(let j in this.users[i].categorized) {
                if(!categorizedPuzzles[this.users[i].categorized[j].id] && this.puzzles[this.users[i].categorized[j].id]) categorizedPuzzles[this.users[i].categorized[j].id] = {
                    ...this.puzzles[this.users[i].categorized[j].id],
                    rate: this.getPuzzleRating(this.users[i].categorized[j].id),
                    categories: this.getPuzzleCategory(this.users[i].categorized[j].id),
                }
            }
        }

        var array = []
        for(let i in categorizedPuzzles) {
            if(!this.ifCategorized(user, categorizedPuzzles[i]) && categorizedPuzzles[i].categories[type + ''] > 0) {
                array.push(categorizedPuzzles[i])
            }
        }

        array = array.sort((a, b) => {return b.categories[type + ''] - a.categories[type + '']})

        array = array.slice(0, 5)

        return array
    }
}

module.exports = {
    PuzzlesAPI: PuzzlesAPI,
    //puzzles: new PuzzlesAPI()
}