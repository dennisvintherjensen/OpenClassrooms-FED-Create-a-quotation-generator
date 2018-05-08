// Avoid global scope
var quotator = (function() {

    "use strict";

    // If offline and no quotes cached, we keep a few default
    var offlineQuotes = {
        computerscience: ["QA Engineer walks into a bar. Orders a beer. Orders 0 beers. Orders 999999999 beers. Orders a lizard. Orders -1 beers. Orders a sfdeljknesv.","There are only two hard things in Computer Science: cache invalidation, naming things and off-by-one errors."],
        forbes: ["The best time for planning a book is while you’re doing the dishes.", "Looking back, I imagine I was always writing. Twaddle it was too. But far better write twaddle or anything, anything, than nothing at all.", "Adam was the only man who, when he said a good thing, knew that nobody had said it before him."]
    };

    var STATE = {
        offline: 0,
        cached: 1,
        online: 2
    };

    // -------------------------------------------------------
    //  QUOTE
    // -------------------------------------------------------

    /**
     * Quote Object
     */
    function Quote(beginning, middle, end) {    

        // Return "new" if it's forgotten
        if (this instanceof Quote === false) {

            return new Quote(beginning, middle, end);

        }

        this.beginning = beginning;
        this.middle = middle;
        this.end = end;
        this.text = beginning + ", " + middle + ", " + end;

    }

    /**
     * Reverses the quote text and returns the quote object
     */
    Quote.prototype.reverse = function() {

        this.text = this.text.split(" ").reverse().join(" ");

        return this;

    }

    /**
     * Shuffles the quote text and returns the quote object
     */
    Quote.prototype.shuffle = function() {

        this.text = this.text.split(" ").shuffle().join(" ");

        return this;

    }

    // -------------------------------------------------------
    //  QUOTE DATABASE
    // -------------------------------------------------------

    /**
     * QuoteDB Object
     */
    function QuoteDB() {

        // Return "new" if it's forgotten
        if (this instanceof QuoteDB == false) {

            return new QuoteDB();

        }

        this.id = "quoteDB";
        this.cached = JSON.parse(localStorage.getItem(this.id));
        this.state = STATE;

    }

    /**
     * Caches or retrieves cache
     * 
     * If cache argument is given, then this is cached. If not, then stored cache (if any) is returned.
     */
    QuoteDB.prototype.cache = function(cache) {

        if (cache) {

            this.cached = cache;

            localStorage.setItem(this.id, JSON.stringify(this.cached));

        } else {

            this.cached = JSON.parse(localStorage.getItem(this.id));

            return this.cached;

        }

    }

    /**
     * Initial load that ensures we have quotes to work with
     * 
     * - Check if we have a cache and if so, use this
     * - If not, try to fetch from online sources
     * - If offline, use offline example data
     */
    QuoteDB.prototype.load = function(init) {

        // Ref for when inside callback
        var that = this;
        var cache = {};

        // Use cache if it exists
        if (this.cached != null) {

            init(this.state.cached);

        // Or else retrieve quotes and cache them
        } else {

            $.get("https://cors-anywhere.herokuapp.com/https://www.forbes.com/forbesapi/thought/uri.json?enrich=true&query=25&relatedlimit=25")
                .then(function(data) {

                    cache.forbes = data.thought.relatedThemeThoughts
                        .map(function(quote) {

                            return quote.quote;

                        });

                    return $.get("http://quotes.stormconsultancy.co.uk/quotes.json");
                })
                .done(function(data) {

                    cache.computerscience = data
                        .map(function(quote) {

                            return quote.quote;

                        });

                    that.cache(cache);

                    init(that.state.online);

                })
                .fail(function() {

                    // Load reserve from offline instead
                    that.cache(offlineQuotes);
                    
                    init(that.state.offline);

                });

        }

    }

    /**
     * Return a random quote
     */
    QuoteDB.prototype.getRandom = function(source) {

        return this.cached[source].getRandom();

    }

    // -------------------------------------------------------
    //  QUOTATOR
    // -------------------------------------------------------

    /**
     * Quotator Object
     */
    function Quotator(init) {

        // Return "new" if it's forgotten
        if (this instanceof Quotator === false) {

            return new Quotator(init);

        }

        this.db = new QuoteDB();
        this.db.load(init);
        this.source;

    }

    /**
     * Returns only the part matched by the first capture group in given regex
     */
    Quotator.prototype.getFragment = function(regex) {

        return this.db.getRandom(this.source).replace(regex, "$1").trim();

    }

    /**
     * Extracts and returns the beginning of a random quote
     */
     Quotator.prototype.getBeginning = function() {

        return this.getFragment(/.*?([\w’'"\s]*)?.*/) || "Since the beginning of time";

     }

    /**
     * Returns the middle of a random quote
     */
     Quotator.prototype.getMiddle = function() {

        return this.getFragment(/.*?(?:[\.,!:;—-]\s)([\w’'"\s]*)?.*/) || "the middle part of a story";

     }

    /**
     * Returns the end of a random quote
     */
    Quotator.prototype.getEnd = function() {

        return this.getFragment(/.*?([\s\w’'"]*[\.,!:;—-]*)[”\s]*$/) || "has always come before the end.";

    }

    /**
     * Generates and returns an array of quotes
     */
    Quotator.prototype.getQuotes = function(amount, source, reverse, shuffle) {

        this.source = source;
        var quotes = [];

        for (var i = 0; i < amount; i++) {

            var quote = new Quote(
                this.getBeginning(),
                this.getMiddle(),
                this.getEnd()
            );

            if (reverse) {

                quote.reverse();

            }

            if (shuffle) {

                quote.shuffle();

            }

            quotes.push(quote);

        }

        return quotes;

    }

    // -------------------------------------------------------
    //  CONSOLERUNNER
    // -------------------------------------------------------

    /**
     * ConsoleRunner Object
     */
    function ConsoleRunner(quotator) {

        // Return "new" if it's forgotten
        if (this instanceof ConsoleRunner === false) {

            return new ConsoleRunner(quotator);

        }

        this.amount = 1;
        this.type = "computerscience";
        this.interval;
        this.quotator = quotator;

    }

    /**
     * Returns menu options as an array
     */
    ConsoleRunner.prototype.getMenuOptions = function() {

        return [
            "1: Print quote(s)",
            "2: Select amount of quotes to print (default is 1)",
            "3: Select type of quotes to print (default is computerscience)",
            "Q: Quit the program"
        ];

    }

    /**
     * Prints the menu and options
     */
    ConsoleRunner.prototype.printMenu = function() {

        var menu = [
            "",
            "GUIDE:",
            "-------------------------------------------------------------",
            "To start the program type 'quotator.run();' and hit 'Enter'. Then enter one of the Menu options in the prompt.",
            "",
            "MENU:",
            "-------------------------------------------------------------",
            ...this.getMenuOptions()
        ];

        console.log(menu.join("\n"));

    }

    /**
     * Handles actions that the user chooses from the menu
     */
    ConsoleRunner.prototype.handleAction = function(action) {

        switch (action) {

            case "1":
                this.quotator.getQuotes(this.amount, this.type).forEach(function(quote) { console.log(quote.text); });
                break;
            case "2":
                this.amount = this.promptForNumber(1, 5, "Enter amount of quotes to print (1-5)");
                break;
            case "3":
                this.type = this.promptForType() === 1 ? 'forbes' : 'computerscience';
                break;
            case "q":
                this.quit();
                break;

        }
        
    }

    /**
     * Prompts the user for a number and return the value
     */
    ConsoleRunner.prototype.promptForNumber = function(from, to, message) {

        var amount = prompt(message);
        
        if (amount === null) {

            this.quit();
            
            return;

        } else {

            amount = Number(amount);

        }

        if (Number.isNaN(amount) || amount < from || amount > to) {

            alert("You must enter a number from " + from + " to " + to);
            
            return this.promptForNumber(from, to, message);

        }

        return amount;

    }

    /**
     * Prompt the user for quote type
     */
    ConsoleRunner.prototype.promptForType = function() {

        return this.promptForNumber(1, 2, "Select a type of quote:\n\n 1: Forbes\n 2: computerscience");

    }

    /**
     * Initiates the ConsoleRunner
     */
    ConsoleRunner.prototype.run = function() {

        var that = this;

        // We use setInterval instead of a while loop.
        // This is due to a while loop loops so fast, that some browsers do not successfully update the console between iterations.
        this.interval = setInterval(function() {

            var action = prompt("Please select an option:\n\n" + that.getMenuOptions().join("\n"));
            
            if (action === null) {

                that.quit();

            }

            that.handleAction(action);

        }, 500);

    }

    /**
     * Handle quitting the program
     */
    ConsoleRunner.prototype.quit = function() {

        // Clean interval
        clearInterval(this.interval);

        console.log('\n\nGOODBYE!');

        this.printMenu();

    }

    // -------------------------------------------------------
    //  Helper functions
    // -------------------------------------------------------

    /**
     * Return a random element from an array
     */
    if (!Array.prototype.getRandom) {
        Array.prototype.getRandom = function() {
            let index = Math.floor(Math.random() * this.length);
            return this[index];
        }
    }

    /**
     * Shuffles the elements in an array using the Durstenfeld shuffle algorithm and returns the array
     * Source: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
     */
    if (!Array.prototype.shuffle) {
        Array.prototype.shuffle = function() {
            for (var i = this.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = this[i];
                this[i] = this[j];
                this[j] = temp;
            }
            return this;
        }
    }

    /**
     * Fetches the amount of quotes of the type that the user has requested and updates the page
     */
    function fetchQuotes() {

        // Get the amount and source of quotes requested.
        var quoteAmount = Number($("#quoteAmount").val());
        var quoteType = $("#quoteSource").val();
        var reverse = $("#reverse").prop("checked");
        var shuffle = $("#shuffle").prop("checked");

        // Get reference to element that quotes should be appended to
        var quotesDiv = $("#quotes");

        // Clear quotes currently displayed
        quotesDiv.html("");

        // Get quotes and append them to the quotesDiv
        quotator.getQuotes(quoteAmount, quoteType, reverse, shuffle).forEach(function(quote) {

            $("<blockquote>").text(quote.text).appendTo(quotesDiv);

        });

    }
    
    /**
     * Initializer
     */
    function init(state) {
        
        console.log("Initialized with state: ", state);

        // Used for setting and clearing auto updating the quotes
        var autoUpdateInterval;

        // Quotes are now loaded - enable Generate Quotes button
        $("#generateQuotes").removeAttr("disabled");

        // React to clicks on "Generate Quotes" button
        $("#generateQuotes").on("click", fetchQuotes);

        // Set or clear auto update interval
        $("#autoUpdate").on("change", function() {

            if (this.checked) {

                autoUpdateInterval = setInterval(fetchQuotes, 10000);

            } else {

                clearInterval(autoUpdateInterval);

            }

        });

    }

    /**
     * Runs the ConsoleRunner
     */
    function run() {

        consoleRunner.run();

    }

    // -------------------------------------------------------
    // Execution
    // -------------------------------------------------------

    // Initialize
    var quotator = new Quotator(init);

    // Init console control and print the menu
    var consoleRunner = new ConsoleRunner(quotator);
    consoleRunner.printMenu();

    // Allow external access
    return {
        run: run
    }

})();
