/*
    Copyright (C) 2021 Vis LLC. - All Rights Reserved

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/*
    Vis Sudoku - Source code can be found on SourceForge.net
*/

var Game = {
    StatIncrementCalls: [],
    Boards: {

    },
    State: null,
    CurrentBoard: null,
    BoardObject: {
        ElementsToRemove: null,
        SelectedDifficulty: null,
        FullBoard: null,
        CurrentBoard: null,
        PuzzleBoard: null,
        BoardChoices: null,
        Duration: null,
        StartTime: null,
        EndTime: null,
    },
    ControlsDiv: null,
    StartTime: null,
    StartDuration: null,
    SavedGamesDiv: null,
    SavedGamesTable: null,
    TimerDiv: null,
    GameDiv: null,
    FailedDiv: null,
    SuccessDiv: null,
    OptionsDiv: null,
    BoardDiv: null,
    BoardField: null,
    BoardView: null,
    Selected: null,
    Difficulty: {
        Easy: 7,
        Medium: 14,
        Hard: 28,
        "Very Hard": 42,
    },
    Selector: [
        ["1", "2", "3"],
        ["4", "5", "6"],
        ["7", "8", "9"],
    ],
    SelectorDiv: null,
    SelectorField: null,
    SelectorView: null,
    Save: function () {
        var data = btoa(JSON.stringify(Game.Boards));
        Game.State.save("boards", data, "");
    },
    Load: function () {
        window.addEventListener('resize', Game.Resize);
        Game.State.load("boards", "Game.LoadI");
    },
    LoadI: function (result) {
        if (!!(result.Data)) {
            try {
                Game.Boards = JSON.parse(atob(result.Data));
            } catch (ex) {
                ex.toString(); // TODO - Remove
            }
            Game.DisplaySavedGames();
        }
    },
    ReturnToOptions: function () {
        Game.CurrentBoard = null;
        Game.Duration = null;
        Game.StartTime = null;
        Game.GameDiv.style.opacity = 0;
        Game.SuccessDiv.style.opacity = 0;
        Game.FailedDiv.style.zIndex = -1;
        Game.FailedDiv.style.opacity = 0;
        Game.SuccessDiv.style.zIndex = -1;                    
        Game.DisplaySavedGames();
        var selector = Game.ControlsDiv.getBoundingClientRect();
        Game.ControlsDiv.style.opacity = 0;
        Game.ControlsDiv.style.transform = "translate3d(-" + selector.width + "px,-" + selector.height + "px,0px)"
        Game.OptionsDiv.style.opacity = 1;
        Game.OptionsDiv.style.transform = "translate3d(0px,0px,0px)"
    },
    DisplaySavedGames: function () {
        Game.SavedGamesTable.innerHTML = "";
        for (var i in Game.Boards) {
            var board = Game.Boards[i];
            var tr = document.createElement("tr");
            Game.SavedGamesTable.appendChild(tr);
            var td = document.createElement("td");
            tr.appendChild(td);
            var button = document.createElement("input");
            td.appendChild(button);
            button.type = "button";
            button.value = i;
            (function (i) {
                button.onclick = function () {
                    Game.Start(null,Game.Boards[i]);
                };
            })(i);
        }
    },
    Failed: function () {
        Game.FailedDiv.style.opacity = 1;
        Game.FailedDiv.style.zIndex = 2;
    },
    Success: function () {
        Game.StatIncrement("Success", 1);
        Game.StatIncrement("Success - " + Game.CurrentBoard.SelectedDifficulty, 1);
        Game.StatIncrement("Success Time", Game.CurrentBoard.Duration);
        Game.StatIncrement("Success Time - " + Game.CurrentBoard.SelectedDifficulty, Game.CurrentBoard.Duration);
        Game.SuccessDiv.style.opacity = 1;
        Game.SuccessDiv.style.zIndex = 2;
        for (var key in Game.Boards) {
            var value = Game.Boards[key];
            if (value === Game.CurrentBoard) {
                delete Game.Boards[key];
                break;
            }
        }
    },
    Update: function (needed, wrong, duplicates, duplicateRows, duplicateColumns, emptyRows, emptyColumns, inUseRows, inUseColumns) {

    },                
    CheckFinished: function () {
        var board = Game.CurrentBoard.CurrentBoard;
        var needed = 0;
        var wrong = 0;
        var duplicates = 0;
        var duplicateRows = { };
        var duplicateColumns = { };
        var emptyRows = { };
        var emptyColumns = { };
        var inUseRows = { };
        var inUseColumns = { };

        for (var j in board) {
            j = parseInt(j);
            inUseRows[j] = { };
            var row = board[j];
            for (i in row) {
                i = parseInt(i);
                if (j === 0) {
                    inUseColumns[i] = { };
                }
                switch (row[i]) {
                    case "":
                    case " ":
                        needed++;
                        var empty = emptyRows[j];
                        if (empty == null) {
                            empty = { };
                            emptyRows[j] = empty;
                        }
                        empty[i] = i;

                        var empty = emptyColumns[i];
                        if (empty == null) {
                            empty = { };
                            emptyRows[j] = empty;
                        }
                        empty[j] = j;
                        
                        break;
                    default:
                        var v = parseInt(row[i]);
                        var o = inUseRows[j][v];
                        var duplicated = false;

                        if (o > 0) {
                            duplicates++;
                            duplicated = true;
                            var duplicateList = duplicateRows[j];
                            if (duplicateList == null) {
                                duplicateList = { };
                                duplicateRows[j] = duplicateList;
                            }
                            var duplicate = duplicateList[o];
                            if (duplicate == null) {
                                duplicate = { };
                                duplicateList[o] = duplicate;
                            }
                            duplicate[i] = i;
                            inUseRows[j][v]++;
                        } else {
                            inUseRows[j][v] = 1;
                        }

                        var o = inUseColumns[i][v];
                        if (o > 0) {
                            if (!duplicated) {
                                duplicates++;
                                duplicated = true;
                            }
                            var duplicateList = duplicateColumns[i];
                            if (duplicateList == null) {
                                duplicateList = { };
                                duplicateColumns[i] = duplicateList;
                            }
                            var duplicate = duplicateList[o];
                            if (duplicate == null) {
                                duplicate = { };
                                duplicateList[o] = duplicate;
                            }
                            duplicate[j] = j;
                            inUseColumns[i][v]++;
                        } else {
                            inUseColumns[i][v] = 1;
                        }
                        break;
                }
                switch (Game.CurrentBoard.PuzzleBoard[j][i]) {
                    case "":
                    case " ":
                        break;
                }
            }
        }

        if (needed <= 0 && duplicates <= 0 && wrong <= 0) {
            Game.Success();
        } else {
            Game.Update(needed, wrong, duplicates, duplicateRows, duplicateColumns, emptyRows, emptyColumns, inUseRows, inUseColumns);
        }
    },                
    SelectValue: function (l) {
        if (!l) {
            return;
        } else {
            var CurrentBoard = Game.CurrentBoard;
            if (Game.Selected != null) {
                var o = l.value();
                if (Game.CurrentBoard.BoardChoices[Game.Selected.y][Game.Selected.x] !== undefined) {
                    if (CurrentBoard.CurrentBoard[Game.Selected.y][Game.Selected.x] == o) {
                    CurrentBoard.CurrentBoard[Game.Selected.y][Game.Selected.x] = " ";
                    Game.CurrentBoard.BoardChoices[Game.Selected.y][Game.Selected.x] = "";
                    Game.StatIncrement("Remove Value", 1);
                } else {
                    CurrentBoard.CurrentBoard[Game.Selected.y][Game.Selected.x] = o;
                    Game.CurrentBoard.BoardChoices[Game.Selected.y][Game.Selected.x] = o;
                    Game.StatIncrement("Select Value", 1);
                }
                Game.BoardField.refresh(function () {
                    Game.BoardView.update();
                });
                Game.CheckFinished();
                }
            }
        }
    },
    SelectBox: function (l) {
        if (!l) {
            return;
        } else {
            var position = {x: l.getX(), y: l.getY()};
            if (Game.CurrentBoard.BoardChoices[position.y][position.x] !== undefined) {
                var newPosition;

                if (Game.Selected === null) {
                    newPosition = true;
                } else if (Game.Selected.x !== position.x || Game.Selected.y !== position.y) {
                    newPosition = true;
                } else {
                    newPosition = false;
                }

                var s = Game.ControlsDiv.style;

                if (newPosition) {
                    var d = Game.BoardView.findViewForLocation(l);
                    var selected = d.toElement().getBoundingClientRect();
                    var parent = Game.BoardDiv.getBoundingClientRect();
                    var controls = Game.ControlsDiv.getBoundingClientRect();

                    var x;
                    var y;

                    x = selected.x + (
                        ((selected.x + selected.width + controls.width) > parent.width)
                        ? 0 - controls.width
                        : selected.width
                    );
                    y = selected.y + (
                        ((selected.y + selected.height + controls.height) > parent.height)
                        ? 0 - controls.height
                        : selected.height
                    );

                    s.opacity = 0.75;
                    s.transform = "translate3d(" + x + "px," + y + "px,0px)";
                    Game.Selected = position;
                } else {
                    var controls = Game.SelectorDiv.getBoundingClientRect();
                    s.transform = "translate3d(" + x + "px," + y + "px,0px)";                            
                    s.opacity = 0;
                    s.transform = "translate3d(" + -(controls.width) + "px," + 0 + "px,0px)";
                    Game.Selected = null;
                }
            }
        }
    },
    UpdateTimer: function () {
        if (Game.StartTime != null) {
            var CurrentTime = new Date();
            var duration = CurrentTime - Game.StartTime + (Game.StartDuration != null ? Game.StartDuration : 0);
            Game.CurrentBoard.Duration = duration;
            var durationShow = Math.floor(duration / 1000);
            var minutes = Math.floor(durationShow / 60);
            var seconds = durationShow % 60;
            Game.TimerDiv.innerText = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
            Game.Save();
        }
    },
    StatIncrementI: function (result) {
        var limit = 1000000000000;
        var name = Game.StatIncrementCalls.shift();
        var amount = Game.StatIncrementCalls.shift();
        value = result.Data;
        if (value >= limit) {
            value = limit;
        } else {
            value += amount;
            if (value >= limit) {
                value = limit;
            }
        }
        Game.State.save(name, value, "");

        switch (name) {
            case "Select Value":
                break;
            case "Started":
                Game.State.incrementAchievement("Started a Puzzle", 1, "");
                break;
            case "Success":
                Game.State.incrementAchievement("Completed a Puzzle", 1, "");
                Game.State.incrementAchievement("Completed 10 Puzzles", 1, "");
                Game.State.incrementAchievement("Completed 25 Puzzles", 1, "");
                break;
            case "Success - Easy":
                Game.State.incrementAchievement("Completed an Easy Puzzle", 1, "");
                break;
            case "Success - Medium":
                Game.State.incrementAchievement("Completed a Medium Puzzle", 1, "");
                break;
            case "Success - Hard":
                Game.State.incrementAchievement("Completed a Hard Puzzle", 1, "");
                break;
            case "Success - Very Hard":
                Game.State.incrementAchievement("Completed a Very Hard Puzzle", 1, "");
                break;                                                                                    
        }
    },
    StatIncrement: function (name, amount) {
        Game.StatIncrementCalls.push(name);
        Game.StatIncrementCalls.push(amount);
        Game.State.load(name, "Game.StatIncrementI");
    },
    Init: function () {
        Game.State = com.field.util.StateAbstract.getState();
        Game.State.signin();
        Game.ControlsDiv = document.getElementById("Controls");
        Game.SavedGamesDiv = document.getElementById("SavedGames");
        Game.SavedGamesTable = document.getElementById("SavedGamesTable");
        Game.TimerDiv = document.getElementById("Timer");
        Game.OptionsDiv = document.getElementById("Options");
        Game.BoardDiv = document.getElementById("Board");
        Game.SelectorDiv = document.getElementById("Selector");
        Game.GameDiv = document.getElementById("Game");
        Game.FailedDiv = document.getElementById("Failed");
        Game.SuccessDiv = document.getElementById("Success");
        Game.BoardField = com.field.Convert.array2DToFieldNoIndexes(
            com.field.Convert.array2DToFieldNoIndexesOptions()
            .value([])
        );
        Game.BoardView = com.field.views.FieldView.create(
            com.field.views.FieldView.options()
            .field(Game.BoardField)
            .tileWidth(9)
            .tileHeight(9)
            .tileBuffer(0)
            .parent(Game.BoardDiv)
            .show(true)
        );
        Game.SelectorField = com.field.Convert.array2DToFieldNoIndexes(
            com.field.Convert.array2DToFieldNoIndexesOptions()
            .value(Game.Selector)
        );
        Game.SelectorView = com.field.views.FieldView.create(
            com.field.views.FieldView.options()
            .field(Game.SelectorField)
            .tileWidth(Game.Selector.length)
            .tileHeight(Game.Selector.length)
            .tileBuffer(0)
            .parent(Game.SelectorDiv)
            .show(true)
        );
        for (var i in Game.SelectorField) {
            var row = Game.SelectorField[i];
            for (var j in row) {
                var l = row[j];
            }
        }
        com.field.Events.locationSelect().addEventListener(function (e) {
            var field = e.field();
            if (field.equals(Game.BoardField)) {
                Game.SelectBox(e.location());
            } else if (field.equals(Game.SelectorField)) {
                Game.SelectValue(e.location());
            }
        });
        setInterval(Game.UpdateTimer, 100);
        Game.Load();
        Game.State.load("theme", "Game.InitI");
    },
    InitI: function (result) {
        var theme;
        try {
            theme = result.Data;
        }
        catch (ex) {}
        
        if (!theme) {
            theme = "dark_theme";
        }
        try {
            document.body.classList.add(theme);
        } catch (ex) {
            document.body.classList.add("dark_theme");
        }
        
        Game.StatIncrement("Init", 1);
    },
    Start: function (sDifficulty, CurrentBoard) {
        Game.StatIncrement("Started", 1);
        if (sDifficulty)
        {
            Game.StatIncrement("New Game", 1);
            Game.StatIncrement("New Game - " + sDifficulty, 1);
            CurrentBoard = { };
            for (var i in Game.BoardObject) {
                CurrentBoard[i] = Game.BoardObject[i];
            }
            Game.CurrentBoard = CurrentBoard;
            CurrentBoard.FullBoard = window.com.roller.Sudoku.generateBoardForAsArray();
            CurrentBoard.CurrentBoard = new Array(CurrentBoard.FullBoard.length);
            CurrentBoard.BoardChoices = new Array(CurrentBoard.FullBoard.length);
            CurrentBoard.PuzzleBoard = new Array(CurrentBoard.FullBoard.length);
            for (var i in CurrentBoard.FullBoard) {
                var row = CurrentBoard.FullBoard[i];
                var newRow = new Array(CurrentBoard.FullBoard.length);
                var choiceRow = new Array(CurrentBoard.FullBoard.length);
                var puzzleRow = new Array(CurrentBoard.FullBoard.length);
                CurrentBoard.CurrentBoard[i] = newRow;
                CurrentBoard.BoardChoices[i] = choiceRow;
                CurrentBoard.PuzzleBoard[i] = puzzleRow;
                for (var j in row) {
                    var o = row[j];
                    newRow[j] = o;
                    puzzleRow[j] = o;
                }
            }
            CurrentBoard.SelectedDifficulty = sDifficulty;
            CurrentBoard.ElementsToRemove = Game.Difficulty[CurrentBoard.SelectedDifficulty];
            for (var i = 0; i < CurrentBoard.ElementsToRemove; i++) {
                var j = Math.floor(Math.random() * CurrentBoard.FullBoard.length * CurrentBoard.FullBoard.length);
                var x = j % CurrentBoard.FullBoard.length;
                var y = Math.floor(j / CurrentBoard.FullBoard.length);

                if (CurrentBoard.CurrentBoard[y][x] === " ") {
                    i--;
                } else {
                    CurrentBoard.CurrentBoard[y][x] = " ";
                    CurrentBoard.PuzzleBoard[y][x] = " ";
                    CurrentBoard.BoardChoices[y][x] = "";
                }
            }
            Game.StartTime = new Date();
            CurrentBoard.StartTime = Game.StartTime;
            function pad(s) {
                s = "" + s;
                switch (s.length) {
                    case 0:
                        return "00";
                    case 1:
                        return "0" + s;
                    default:
                        return s;
                }
            }                        
            Game.Boards[
                CurrentBoard.SelectedDifficulty + "-" + 
                CurrentBoard.StartTime.getFullYear() + "-" + 
                pad(CurrentBoard.StartTime.getMonth() + 1) + "-"  +
                pad(CurrentBoard.StartTime.getDate()) + "-" +
                pad(CurrentBoard.StartTime.getHours()) + "-" +
                pad(CurrentBoard.StartTime.getMinutes()) + "-" + 
                pad(CurrentBoard.StartTime.getSeconds())
            ] = CurrentBoard;
        } else if (!!CurrentBoard) {
            Game.StatIncrement("Load Game", 1);
            Game.StartTime = new Date();
            Game.CurrentBoard = CurrentBoard;
            Game.StartDuration = CurrentBoard.Duration;
        }

        Game.BoardField = com.field.Convert.array2DToFieldNoIndexes(
            com.field.Convert.array2DToFieldNoIndexesOptions()
            .value(CurrentBoard.CurrentBoard)
        );
        {
            var field = Game.BoardField;
            var j = 0;
            while (j < field.height()) {
                var i = 0;
                while (i < field.width()) {
                    var l = field.get(i, j);
                    var x = i % 3;
                    var y = j % 3;

                    switch (x) {
                        case 0:
                            l.attribute("left", "border");
                            break;
                        case 1:
                            break;
                        case 2:
                            l.attribute("right", "border");
                            break;
                    }

                    switch (y) {
                        case 0:
                            l.attribute("top", "border");
                            break;
                        case 1:
                            break;
                        case 2:
                            l.attribute("bottom", "border");
                            break;
                    }

                    if (Game.CurrentBoard.BoardChoices[l.getY()][l.getX()] !== undefined) {
                        l.attribute("player", "selectable");
                    }

                    l.doneWith();
                    i++;
                }

                j++;
            } 
        }

        Game.BoardView.field(Game.BoardField);
        var options = Game.OptionsDiv.getBoundingClientRect();
        Game.OptionsDiv.style.opacity = 0;
        Game.OptionsDiv.style.transform = "translate3d(-" + options.width + "px,-" + options.height + "px,0px)"
        var selector = Game.ControlsDiv.getBoundingClientRect();
        Game.ControlsDiv.style.opacity = 0;
        Game.ControlsDiv.style.transform = "translate3d(-" + selector.width + "px,-" + selector.height + "px,0px)"
        Game.GameDiv.style.opacity = 1;
    },
    SwitchTheme: function (e) {
        Game.StatIncrement("Switch Theme", 1);
        var themes = [ "light_theme", "dark_theme" ];
        var currentTheme = -1;
        var nextTheme;
        var i = 0;
        while (i < themes.length) {
            if (e.className.indexOf(themes[i]) >= 0) {
                currentTheme = i;
                break;
            } else {
                i++;
            }
        }
        if (currentTheme == -1) {
            currentTheme = 0;
        }
        nextTheme = (currentTheme + 1) % themes.length;
        e.classList.add(themes[nextTheme]);
        e.classList.remove(themes[currentTheme]);
        Game.State.save("theme", themes[nextTheme], "");
    },
    Resize: function (e) {
        Game.BoardDiv.innerHTML = "";
        Game.SelectorDiv.innerHTML = "";
        Game.BoardView = com.field.views.FieldView.create(
            com.field.views.FieldView.options()
            .field(Game.BoardField)
            .tileWidth(9)
            .tileHeight(9)
            .tileBuffer(0)
            .parent(Game.BoardDiv)
            .show(true)
        );
        Game.SelectorView = com.field.views.FieldView.create(
            com.field.views.FieldView.options()
            .field(Game.SelectorField)
            .tileWidth(Game.Selector.length)
            .tileHeight(Game.Selector.length)
            .tileBuffer(0)
            .parent(Game.SelectorDiv)
            .show(true)
        );
    },
};