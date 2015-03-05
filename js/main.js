window.onload = function() {
    // You might want to start with a template that uses GameStates:
    //     https://github.com/photonstorm/phaser/tree/master/resources/Project%20Templates/Basic
    
    // You can copy-and-paste the code from any of the examples at http://examples.phaser.io here.
    // You will need to change the fourth parameter to "new Phaser.Game()" from
    // 'phaser-example' to 'game', which is the id of the HTML element where we
    // want the game to go.
    // The assets (and code) can be found at: https://github.com/photonstorm/phaser/tree/master/examples/assets
    // You will need to change the paths you pass to "game.load.image()" or any other
    // loading functions to reflect where you are putting the assets.
    // All loading functions will typically all be found inside "preload()".
    
    "use strict";
    
    var game = new Phaser.Game( 800, 600, Phaser.AUTO, 'game', { preload: preload, create: create, update: update, render: render } );
    
    function preload() {
        // Loads images
        game.load.image( 'world', 'assets/RoadBackground.png' );
        game.load.image( 'player', 'assets/SportsCar.png');
        game.load.image( 'wall', 'assets/Barrier.png');
        game.load.image( 'alert', 'assets/sign.png');
        
        // loads sound
        game.load.audio( 'backgroundMusic', 'assets/AnimalCrossing-TownHall.ogg');
    }
    
    //background image
    var world;
    
    //player sprite
    var player;
    
    //warnings
    var warnings;
    var warningTimer;
    
    //enemy sprites and enemy generation
    var enemies;
    var enemyTimer = 1500;
    var nextEnemy = 0;
    
    //timer of the game
    var timer;
    var timerText;
    var timerStyle;
    var minutes;
    var seconds;
    var timerActive = true;
    
    //player movement
    var playerVelocity;
    
    //player's current gear setting
    var lowgear;
    var gearText;
    var gearReady;
    
    //player's current score
    var score;
    
    //game over message
    var lost;
    var style;
    var isAlive;
    
    //player input
    var cursors;
    var shiftGear;
    
    //sounds
    var music;
    
    function create() {
        game.physics.startSystem(Phaser.Physics.ARCADE);
        
        // creates background, player, and monsters
        world = game.add.tileSprite(0, 0, 800, 600, 'world');
        player = game.add.sprite( game.world.centerX, game.world.centerY, 'player' );
        
        
        // Create a sprite at the center of the screen using the 'logo' image.
        // Anchor the sprite at its center, as opposed to its top-left corner.
        // so it will be truly centered.
        player.anchor.setTo( 0.5, 0.5 );
        
        // Turn on the arcade physics engine for sprites.
        game.physics.enable( player, Phaser.Physics.ARCADE );
        // Make it bounce off of the world bounds.
        player.body.collideWorldBounds = true;
        
        
        // adds warnings
        warnings = game.add.group();
        warnings.enableBody = true;
        warnings.physicsBodyType = Phaser.Physics.ARCADE;
        warnings.createMultiple(20, 'alert', 0, false);
        warnings.setAll('anchor.x', 0.5);
        warnings.setAll('anchor.y', 0.5);
        warnings.setAll('outOfBoundsKill', true);
        warnings.setAll('checkWorldBounds', true);
        
        // adds barriers
        enemies = game.add.group();
        enemies.enableBody = true;
        enemies.physicsBodyType = Phaser.Physics.ARCADE;
        enemies.createMultiple(20, 'wall', 0, false);
        enemies.setAll('anchor.x', 0.5);
        enemies.setAll('anchor.y', 0.5);
        enemies.setAll('outOfBoundsKill', true);
        enemies.setAll('checkWorldBounds', true);
        
        // Player controls
        cursors = game.input.keyboard.createCursorKeys();
        shiftGear = game.input.keyboard.addKey(Phaser.Keyboard.Z);
        
        // Adds sound
        music = game.add.audio('backgroundMusic', 1, true);
        music.play('', 0, 1, true);
        
        //initializes timer
        timer = game.time.now+180000;
        timerStyle = { font: "40px Arial", fill: "#000000", align: "center" }
        timerText = game.add.text(game.world.centerX, 30, "3:00", timerStyle);
        timerText.anchor.setTo(0.5, 0.5);
        
        //initializes score
        score = 0;
        isAlive = true;
        
        //creates game over
        style = { font: "65px Arial", fill: "#ff0044", align: "center" };
        
        //initializes player speed
        playerVelocity = 0;
        lowgear = true;
        gearText = "LOW";
        gearReady = game.time.now;
    }
    
    function update() {
        world.tilePosition.x -= parseInt(playerVelocity/50);
        // Controls movement of the player
        player.body.velocity.setTo(0, 0);
        if (cursors.left.isDown)
        {
            playerVelocity -= 30;
            if(playerVelocity < 0) playerVelocity = 0;
        }
        else if (cursors.right.isDown)
        {
            //checks player's gear setting
            //LOW = high acceleration, capped speed
            //HIGH = slow acceleration, no capped speed
            if(lowgear)
            {
                playerVelocity += 20;
                if(playerVelocity > 1800) playerVelocity = 1800;
            }
            else
            {
                playerVelocity += 2;
            }
        }
        else
        {
            playerVelocity -= 5;
            if(playerVelocity < 0) playerVelocity = 0;
        }
            
        if (cursors.up.isDown)
        {
            player.body.velocity.y = -200;
        }
        else if (cursors.down.isDown)
        {
            player.body.velocity.y = 200;
        }
        
        // controls switching gears
        if(shiftGear.downDuration(50) && game.time.now > gearReady)
        {
            lowgear = !lowgear;
            if(lowgear)
            {
                gearText = "LOW";
            }
            else
            {
                gearText = "HIGH";
            }
            gearReady = game.time.now + 500;
        }
        
        //creates enemies (police speed traps woot)
        createEnemy();
        
        //now to check enemies (and warnings)
        game.physics.arcade.overlap(enemies, player, monsterHandler, null, this);
        enemies.forEachAlive(updateEnemies, this);
        warnings.forEachAlive(updateWarnings, this);
        
        //updates timer
        if(timerActive)
        {
            var timeLeft = timer - game.time.now;
            minutes = parseInt(timeLeft)/60000;
            seconds = (parseInt(timeLeft)/1000) % 60;
            if(seconds >= 10)
                timerText.setText(parseInt(minutes) + ":" + parseInt(seconds));
            else
                timerText.setText(parseInt(minutes) + ":0" + parseInt(seconds));

            if((timeLeft <= 0) && isAlive)
            {
                timeUp();
            }
        }
        
        //updates score
        if(isAlive)
            score += parseInt(playerVelocity/10);
    }
    
    function createEnemy() {
        if (game.time.now > nextEnemy && enemies.countDead() > 0)
        {
            var indicator = (game.rnd.integer() % 5 + 1);
            
            nextEnemy = game.time.now + enemyTimer;
            var enemy = enemies.getFirstExists(false);
            enemy.reset(2000, indicator * 100);
            enemy.body.velocity.x = 200 - playerVelocity;
            
            var warning = warnings.getFirstExists(false);
            warning.reset(750, indicator * 100);
            warningTimer = game.time.now + enemyTimer/2;
            warning.body.velocity.x = 0;
            
            
            if(score > 500000)
                enemyTimer = 800;
        }
    }
    
    function updateEnemies(enemy)
    {
        enemy.body.velocity.x =  -playerVelocity;
    }
    
    function updateWarnings(warning)
    {
        if(game.time.now > warningTimer)
            warning.kill();
    }
    
    function monsterHandler(player, enemy)
    {
        enemy.kill();
        playerVelocity /= 10;
    }
    
    //game ends
    function timeUp()
    {
        player.kill();
        isAlive = false;
        timerActive = false;
        lost = game.add.text(game.world.centerX, game.world.centerY, "Time up!\nScore: " + score, style);
        lost.anchor.setTo( 0.5, 0.5);
    }
    
    function render() {
        game.debug.text("Score: " + score, 200, 595);
        game.debug.text("Speed: " + parseInt(playerVelocity/10) + " mph", 20, 575);
        game.debug.text("Gear: " + gearText, 20, 595);
    }
};
