var Player = function(game, x, y, width, height) {
    var _this = this;
    this.game = game;
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.velocityX = 0;
	this.velocityY = 0;
	this.angle = 0;
	this.maxJumpDist = 12;
	this.jumpDist = 0;
	this.lasty = y;
	this.lastx = x;
    this.DEBUG = {};
	
	// States
	this.isJumping = false;
	this.isFalling = false;
    this.isOnGround = false;
	this.isAlive = true;
    
    // Start jumping
	this.game.inputManager.addKeyEvent(KeyAction.jump, function() {
		if(_this.isOnGround) {
            _this.isJumping = true;
        }
	});
};

// Adds velocity to the player
Player.prototype.addVelocity = function(x, y) {
	this.velocityX += x;
	this.velocityY += y;
};

Player.prototype.update = function(game) {
    // Is player on the ground
    this.isOnGround = !this.isFalling && !this.isJumping;

	if(this.isAlive) {
		// Accelerate
		if(game.inputManager.isKeyDown(KeyAction.forward)) {
			this.addVelocity(0.65, 0);
        }
		
		// Brake
		if(game.inputManager.isKeyDown(KeyAction.backward)) {
			this.addVelocity(-0.65, 0);
        }
			
		// Jump
        if(this.isJumping) {
            if(game.inputManager.isKeyDown(KeyAction.jump)) {
                if(!this.isFalling) {
                    this.isJumping = true;
                }
            // Stop jumping
            } else {
                if(this.isJumping) {
                    this.isJumping = false;
                    jumpDist = 0;
                }
            }
        }
	}

	this.y += 7.5; // gravity

    // Pull the player down if on a slope
    if(this.isOnGround) {
        var pullVel = 0.2;
        if(this.angle > 0 && this.angle <= 45) {
            var vel = this.angle / 45 * pullVel;
            if(vel > pullVel) { vel = pullVel; }
            if(vel < 0) { vel = 0; }
            this.velocityX += vel;
        }
        if(this.angle < 0 && this.angle >= -45) {
            var vel = (this.angle * -1) / 45 * pullVel;
            if(vel > pullVel) { vel = pullVel; }
            if(vel < 0) { vel = 0; }
            this.velocityX -= vel;
        }
    }
    
    // Add velocity to position
	this.x += this.velocityX;
	this.y += this.velocityY;
	
	// Decay velocity
	this.velocityX *= 0.93;
	this.velocityY *= 0.90;

	// Collision point
	var adjx = ((this.width / 2) * Math.cos((this.angle + 90) * Math.PI / 180)) + this.x;
	var adjy = ((this.width / 2) * Math.sin((this.angle + 90) * Math.PI / 180)) + (this.y + 2); // 2px padding for stroke width
	
	// Find the y direction the player is moving
	var yvel;
	var yfixed = this.y.toFixed(1);
	if(yfixed < this.lasty) yvel = 1;
	if(yfixed > this.lasty) yvel = -1;
	if(yfixed == this.lasty) yvel = 0;
    
	// Finds the line the player is going to collide with
	var playerPos = adjx / /*levelPrefs.width*/30 >> 0;
	
	// Loop through tiles and collide with the player
	for(var i = 0; i < game.sceneManager.scene.tiles.length; i++) {
		if(i === playerPos) {
            var tile0 = game.sceneManager.scene.tiles[i-1];
            var tile1 = game.sceneManager.scene.tiles[i];
            var tile2 = game.sceneManager.scene.tiles[i+1];
            
            var run = tile1.x2 - tile1.x1;
            var rise = tile1.y2 - tile1.y1;
            var slope = rise / run;
            var intersect = tile1.y1 - (tile1.x1 * slope);
            var col = (slope * adjx) + intersect;
            
            var angle = Util.radToDeg(Math.atan(rise / run));
            this.angle = angle;
            
            // Collide with current tile's y
            if(adjy > col && tile1.type != TileType.air) {
                if(this.lasty < col && !(game.inputManager.isKeyDown(KeyAction.down) && tile1.type == TileType.passthrough)) {
                    this.y = col + (this.y - adjy);
                    this.isFalling = false;
                }
            } else {
                // Collide with left tile's y
                if(tile0.type != TileType.air 
                && this.lasty < tile0.y2 && adjy > tile0.y2 
                && adjx - this.width / 2 < tile0.x2
                && !(game.inputManager.isKeyDown(KeyAction.down) && tile0.type == TileType.passthrough)) {
                    this.y = (tile0.y2 * 1) + (this.y - adjy);
                    this.isFalling = false;
                }
                
                // Collide with right tile's y
                if(tile2.type != TileType.air 
                && this.lasty < tile2.y1 && adjy > tile2.y1 
                && adjx + this.width / 2 > tile2.x1
                && !(game.inputManager.isKeyDown(KeyAction.down) && tile2.type == TileType.passthrough)) {
                    this.y = (tile2.y1 * 1) + (this.y - adjy);
                    this.isFalling = false;
                }
                
                if(!this.isJumping) {
                    this.isFalling = true;
                }
            }
            
            // Collide with left tile's x
            if(tile0.type == TileType.solid && adjx - this.width / 2 < tile0.x2 && adjy > tile0.y2) {
                if(this.lasty >= tile1.y1) {
                    this.x = tile0.x2 + this.width / 2;
                }
                //this.isAlive = false;
            }
            
            // Collide with right tile's x
            if(tile2.type == TileType.solid && adjx + this.width / 2 > tile2.x1 && adjy > tile2.y1) {
                if(this.lasty >= tile1.y2) {
                    this.x = tile2.x1 - this.width / 2;
                }
                //this.isAlive = false;
            }
        }
	}
	
	// Apply extra gravity to keep player on slope during downward movement
	// This prevents a bug where the player cannot jump while moving quickly
	// downwards due to being in a "falling" state.
	if(this.angle) {
		if(yvel < 0 && (this.angle < -33 || this.angle > 33) && !this.isJumping) 
			this.y += 2;
	}
	
	// Jumping logic
	if(this.isJumping) {
		var jumpVel = -18;
		this.jumpDist += 1;
		
		// Finished jumping
		if(this.jumpDist > this.maxJumpDist) {
			this.isJumping = false;
			this.isFalling = true;
			this.jumpDist = 0;
		} else {
			this.velocityY = jumpVel;
		}	
	} else {
        this.jumpDist = 0;
    }
	
	// Die when falling off the edge of the world
	if(adjy > game.renderManager.canvas.height + this.width) {
		this.isAlive = false;
	}
	
	// Collide with left side of level
	if(this.x - (this.width / 2) <= 30) {
		this.x = this.width / 2 + 30;
		this.velocityX = 0;
	}
	
	// Collide with right side of level
	if(this.x + (this.width / 2) >= game.sceneManager.scene.tiles.length * /*levelPrefs.width*/30 - 30) {
		this.x = game.sceneManager.scene.tiles.length * /*levelPrefs.width*/30 - (this.width / 2) - 30;
		this.velocityX = 0;
	}
	
	// Reset when the player dies
	if(!this.isAlive) {
		this.x = /*levelStart.x*/game.renderManager.canvas.width / 2;
		this.y =  /*levelStart.y*/100;
		this.velocity = {x: 0, y: 0};
        this.jumpDist = 0;
        this.isJumping = false;
        this.isFalling = false;
        this.isOnGround = false;
		this.isAlive = true;
	}
	
	this.lasty = this.y.toFixed(1); // last known y position
	this.lastx = this.x.toFixed(1); // last known y position
	
	// Update the camera position
	game.sceneManager.scene.camera.x = this.x - (game.renderManager.canvas.width / 2);
};

Player.prototype.draw = function(renderManager, camera) {
	var x = ((this.width / 2) * Math.cos((this.angle + 90) * Math.PI / 180)) + this.x;
	var y = ((this.width / 2) * Math.sin((this.angle + 90) * Math.PI / 180)) + this.y;
	renderManager.drawLine(this.x - camera.x, this.y, x - camera.x, y, "#a7c6e0", 2);
	//renderManager.drawRectangle((this.x - this.width / 2) - camera.x, this.y - this.height / 2, this.width, this.height, "#114A93", 2, "transparent");
	renderManager.drawCircle(this.x - camera.x, this.y, this.width / 2, "#218ae0", 2, "transparent");
};