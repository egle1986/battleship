var Game = function(){
    this.history = [];
    this.game_ended = false;
    
    //seadistab mängu
    this.initialize = function(){
        $("#start-game").click(this.start);
        $("#board-size").change(this.update_boat_count_selector);   
        this.update_boardsize_selector();
        this.update_boat_count_selector();
        this.render_history();
    }
    
    //jookseb siis kui kasutaja klikib väljakule
    this.click = function(event, board){
        console.log(board.player.player_name);
        var x = parseInt(event.target.getAttribute("data-x"), 10);
        var y = parseInt(event.target.getAttribute("data-y"), 10);
        console.log(x + " " + y);
        if(board.player == this.rival && !this.game_ended){
            var success = board.kill_boat(x, y);
            if(!success){
                this.challenger.board.ai_run();
                this.challenger.board.render();
            }
            else if(board.dead()){
                this.end(this.challenger);
            }
        }
        board.render();
    }
    
    //see genereerib laevade arvu valikul
    this.update_boat_count_selector = function(){
        $("#boat-count").empty();
        for(var i = 1; i < this.get_boardsize(); i++){
            $("#boat-count").append("<option value=" + i + ">" + i + "</options>");
        }
    }.bind(this)
    
    //genereerib väljaku suuruse valikud
    this.update_boardsize_selector = function(){
        $("#board-size").empty();
        for (var i = 3; i < 11; i++){
            $("#board-size").append("<option value=" + i + ">" + i + "x" + i + "</options>");
        }
    }
    
    //tagastab valitud väljaku suuruse
    this.get_boardsize = function(){
        return parseInt($("#board-size").val());
    }
    
    //tagastab valitud laevade arvu
    this.get_boat_count = function(){
        return parseInt($("#boat-count").val());
    }
    
    this.start = function(){
        this.game_ended = false;
        var player_name = $("#player-name").val();
        this.challenger = new Player(this, player_name, false, "player2");
        this.challenger.board.create();
        this.challenger.board.render();
        this.rival = new Player(this, "Arvuti", true, "player1");
        this.rival.board.create();
        this.rival.board.render();
        this.start_time = new Date().getTime()/1000;
        $("#game-status").empty();
    }.bind(this)
    
    this.end = function(winner){
        this.game_ended = true;
        console.log("Mängu võitis " + winner.player_name);
        $("#game-status").html("Mängu võitis " + winner.player_name);
        this.game_time = new Date().getTime()/1000 - this.start_time;
        this.add_history();
        this.render_history();
    }
    
    this.add_history = function(){
        var h = {};
        h.game_time = this.game_time;
        h.board_size = this.get_boardsize();
        h.ship_count = this.get_boat_count();
        h.challenger_moves = this.challenger.moves;
        h.rival_moves = this.rival.moves;
        this.history.unshift(h);
        this.history = this.history.splice(0, 10);
        this.send_history(h);
    }
    
    //saadab ajaloo serverile
    this.send_history = function(history){
        var h = {};
        h.game_time = history.game_time;
        h.player1 = this.challenger.player_name;
        h.player2 = this.rival.player_name;
        h.points1 = this.challenger.points;
        h.points2 = this.rival.points;
        h.start_time = this.start_time;
        $.post("../cgi-bin/prax3/saveHistory.py", h)
        console.log("points1 = " + h.points1 + " points2 = " + h.points2);
    }
    
    this.render_history = function(){
        var table = "";
        table += "<tr>";
        table += "<th>NR</th>";
        table += "<th>Väljaku suurus</th>";
        table += "<th>Laevade arv</th>";
        table += "<th>Minu liigutuste arv</th>";
        table += "<th>Vastase liigutuste arv</th>";
        table += "<th>Aeg (sek)</th>";
        table += "</tr>";
        for(var i = 0; i < this.history.length; i++){
            var h = this.history[i];
            table += "<tr>";
            table += "<td>" + i + "</td>";
            table += "<td>" + h.board_size + "</td>";
            table += "<td>" + h.ship_count + "</td>";
            table += "<td>" + h.challenger_moves + "</td>";
            table += "<td>" + h.rival_moves + "</td>";
            table += "<td>" + h.game_time.toFixed(0) + "</td>";
            table += "</tr>";
        }
        $("#game-history").html(table);
    }
}

var Player = function(game, player_name, opponent, board_id){
    this.game = game;
    this.player_name = player_name;
    this.opponent = opponent;
    this.board_id = board_id;
    this.board = new Board(this);
    this.moves = 0;
    this.points = 0;
}

var Board = function(player){
    this.player = player;
    this.game = player.game;
    this.board = [];
    this.ai = [];
    
    //loome mängu väljaku x ja y koordinaatidega, kus 0 on vesi :)
    this.create = function(){
        var coordinates = [];
        for(var y = 0; y < this.game.get_boardsize(); y++){
            this.board[y] = [];
            for(var x = 0; x < this.game.get_boardsize(); x++){
                this.board[y][x] = 0;
                coordinates.push({x:x, y:y})
                this.ai.push({x:x, y:y})
            }
        }
        //siin paigutame laevad
        console.log("paigutan " + this.game.get_boat_count() + " laeva mängija " + this.player.player_name + " väljakule");
        for(var z = 0; z < this.game.get_boat_count(); z++){
            var i = Math.floor(Math.random() * coordinates.length);
            var point = coordinates.splice(i, 1)[0];
            if (point) {
                if(this.can_add_boat(point)){
                    console.log("Paigutasin laeva punkti " + point.x + " x " + point.y);
                    this.board[point.y][point.x] = 2;
                    this.board[point.y][point.x+1] = 2;
                }
                else{
                    console.log("Punkt " + point.x + " x " + point.y + " ei sobinud");
                    z--; //proovime sama laeva uuesti paigutada
                }
            } else {
                console.log(coordinates);
                console.log(i);
            }
        }
    }
    
    //siin mängib arvuti :)
    this.ai_run = function(){
        while(true){
            var i = Math.floor(Math.random() * this.ai.length);
            var point = this.ai.splice(i, 1)[0];
            var success = this.kill_boat(point.x, point.y);
            if(!success){
                return;
            }
            if(this.dead()){
                this.player.game.end(this.player.game.rival);
                return;
            }
        }
    }
    
    //kui väljakul ei leidu eluslaevu, siis tagastab true, vastasel juhul false
    this.dead = function(){
        for(var y = 0; y < this.board.length; y++){
            for(var x = 0; x < this.board.length; x++){
                var c = this.board[y][x];
                if(c == 2){
                    return false;
                }
            }
        }
        return true;
    }
    
    //kas saame selle koordinaadi peale laeva lisada
    this.can_add_boat = function(point){
        try {  // üritame laeva paigutada
            if(point.x+2 > this.board.length){
                console.log("Laev on üle parempoolse serva");
                return false;
            }
            else if(this.board[point.y][point.x+2] == 2){
                console.log("Laeva parempoolses otsas on teine laev");
                return false;
            }
            else if(this.board[point.y][point.x-1] == 2){
                console.log("Laeva vasakpoolses otsas on teine laev");
                return false;
            }
            if(point.y-1 >= 0){
                if(this.board[point.y-1][point.x] == 2){
                    console.log("Laeva üleval servas on teine laev");
                    return false;
                }
                if(this.board[point.y-1][point.x+1] == 2){
                    console.log("Laeva paremal pool üleval servas on teine laev");
                    return false;
                }
            }
            if(point.y+1 < this.board.length){
                if(this.board[point.y+1][point.x] == 2){
                    console.log("Laeva all servas on teine laev");
                    return false
                }
                if(this.board[point.y+1][point.x+1] == 2){
                    console.log("Laeva all paremal servas on teine laev");
                    return false;
                }
            }
            return true;
        } 
        catch (error) {  // arvatavasti üritasime ligi pääseda väljaku kordinaatidele mida pole olemas
            console.log(error)
            return false;
        }
    }
    
    //võtab boardi ja teeb sellest html'i
    this.render = function(){
        var table = $("#"+this.player.board_id);
        table.empty();
        table.append("<tr><th colspan="+this.game.get_boardsize()+">"+this.player.player_name+"</th></tr>");
        var game_field = "";
        for(var y = 0; y < this.board.length; y++){
            game_field +="<tr>";
            for(var x = 0; x < this.board[y].length; x++){
                var c = this.board[y][x];
                game_field +="<td data-x=" + x + " data-y=" + y + " >";
                if (c == 0){
                    game_field += " ";
                }
                else if (c == 1){
                    game_field += "X";
                }
                else if (c == 2  && !this.player.opponent){
                    if(this.board[y][x-1] == 2 || this.board[y][x-1] == 3){
                        game_field += "<img src = 'images/ahter.png'>"
                    }
                    else {
                        game_field += "<img src = 'images/voor.png'>";
                    }
                }
                else if (c == 3){
                    if(this.board[y][x-1] == 3 || this.board[y][x-1] == 2){
                        game_field += "<img src = 'images/ahter_dead.png'>"
                    }
                    else {
                        game_field += "<img src = 'images/voor_dead.png'>";
                    }
                }
                game_field += "</td>";
            }
            game_field += "</tr>";
        }
        table.append(game_field);
        $("#" + this.player.board_id + ">tbody>tr>td").click(function(event){
            this.game.click(event, this)
        }.bind(this));
    }
    
    this.kill_boat = function(x, y){
        var c = this.board[y][x];
        if(this.player.opponent){
            this.player.game.challenger.moves++;
        }
        else{
            this.player.game.rival.moves++;
        }
        if(c == 0){
            this.board[y][x] = 1; //üritasime tulistada, kuid oli ainult vesi
            return false;
        }
        else if(c == 2){
            this.board[y][x] = 3; //saime laevale pihta
            if(this.boat_dead(x, y)){
                if(this.player.opponent){
                    this.player.game.challenger.points++;
                }
                else{
                    this.player.game.rival.points++;
                }
            }
            return true;
        }
    }
    
    this.boat_dead = function(x, y){
        console.log(this.board)
        if(x-1>=0){
            var c1 = this.board[y][x-1];
        }
        else{
            var c1 = -1;
        }
        if(x+1<this.board.length){
            var c2 = this.board[y][x+1];
        }
        else{
            var c2 = -1;
        }
        var c = this.board[y][x];
        console.log(x + "x" + y + " c1 = " + c1 + " c2 = " + c2 + " c = " + c);
        if(c1 == 3){
            return true;
        }
        else if(c2 == 3){
            return true;
        }
        else {
            return false;
        }
    }
}

$(document).ready(function(){
    game = new Game();
    game.initialize();
})