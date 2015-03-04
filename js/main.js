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
        game.load.image( 'world', 'assets/SkyRoadBackground.png' );
        game.load.image( 'ambulance', 'assets/Ambulance.png');
        game.load.image( 'traffic', 'assets/Car.png');
        
        // loads sound
        game.load.audio( 'backgroundMusic', 'assets/BedoBedo.ogg');
    }
    
    //background image
    var world;
    
    //player sprite
    var player;
    
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
    
    //player's current score
    var score;
    
    //game over message (and player death)
    var lives;
    var lost;
    var style;
    var isAlive;
    
    //player input
    var cursors;
    
    //sounds
    var music;
    
    function create() {
        game.physics.startSystem(Phaser.Physics.ARCADE);
        
        // creates background, player, and monsters
        world = game.add.tileSprite(0, 0, 800, 600, 'world');
        player = game.add.sprite( game.world.centerX, game.world.centerY, 'ambulance' );
        
        
        // Create a sprite at the center of the screen using the 'logo' image.
        // Anchor the sprite at its center, as opposed to its top-left corner.
        // so it will be truly centered.
        player.anchor.setTo( 0.5, 0.5 );
        
        // Turn on the arcade physics engine for sprites.
        game.physics.enable( player, Phaser.Physics.ARCADE );
        // Make it bounce off of the world bounds.
        player.body.collideWorldBounds = true;
        
        
        // adds traffic
        enemies = game.add.group();
        enemies.enableBody = true;
        enemies.physicsBodyType = Phaser.Physics.ARCADE;
        enemies.createMultiple(10, 'traffic', 0, false);
        enemies.setAll('anchor.x', 0.5);
        enemies.setAll('anchor.y', 0.5);
        enemies.setAll('outOfBoundsKill', true);
        enemies.setAll('checkWorldBounds', true);
        
        // Player controls
        cursors = game.input.keyboard.createCursorKeys();
        
        // Adds sound
        music = game.add.audio('backgroundMusic', 1, true);
        music.play('', 0, 1, true);
        
        //initializes timer
        timer = game.time.now+120000;
        timerStyle = { font: "40px Arial", fill: "#000000", align: "center" }
        timerText = game.add.text(game.world.centerX, 30, "2:00", timerStyle);
        timerText.anchor.setTo(0.5, 0.5);
        
        //initializes score and player's lives
        lives = 3;
        score = 0;
        isAlive = true;
        
        //creates game over
        style = { font: "65px Arial", fill: "#ff0044", align: "center" };
        
        //initializes player speed
        playerVelocity = 0;
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
            playerVelocity += 30;
            if(playerVelocity > 600) playerVelocity = 600;
        }
        else
        {
            playerVelocity -= 5;
            if(playerVelocity < 0) playerVelocity = 0;
        }
            
        if (cursors.up.isDown)
        {
            player.body.velocity.y = -150;
        }
        else if (cursors.down.isDown)
        {
            player.body.velocity.y = 150;
        }
        
        //creates enemies (flying traffic ugh)
        createEnemy();
        
        //now to check enemies
        game.physics.arcade.overlap(enemies, player, monsterHandler, null, this);
        enemies.forEachAlive(updateEnemies, this);
        
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
                defeat();
            }
        }
        
        //updates score
        if(isAlive)
            score += playerVelocity;
        if(score >= 2500000)
            victory();
    }
    
    function createEnemy() {
        if (game.time.now > nextEnemy && enemies.countDead() > 0)
        {
            nextEnemy = game.time.now + enemyTimer;

            var enemy = enemies.getFirstExists(false);

            enemy.reset(850, (game.rnd.integer() % 5 + 1) * 100);

            enemy.body.velocity.x = 200 - playerVelocity;
            
            if(score > 1000000)
                enemyTimer = 800;
            if(score > 2000000)
                enemyTimer = 500;
        }
    }
    
    function updateEnemies(enemy)
    {
        enemy.body.velocity.x = 200 - playerVelocity;
    }
    
    function monsterHandler(player, enemy)
    {
        enemy.kill();
        lives -= 1;
        if(lives <= 0)
        {
            defeat();
        }   
    }
    
    //if player wins
    function victory()
    {
        player.kill();
        isAlive = false;
        timerActive = false;
        lost = game.add.text(game.world.centerX, game.world.centerY, "You made it!", style);
        lost.anchor.setTo( 0.5, 0.5);
    }
    
    //if player loses
    function defeat()
    {
        player.kill();
        isAlive = false;
        timerActive = false;
        lost = game.add.text(game.world.centerX, game.world.centerY, "You didn't make it...", style);
        lost.anchor.setTo( 0.5, 0.5);
    }
    
    function render() {
        game.debug.text("Progress: " + parseInt(score/25000) + "%", 20, 570);
        game.debug.text("Lives: " + lives, 20, 590);
    }
};
