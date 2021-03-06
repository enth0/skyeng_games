window.addEventListener("load", function() {

	var timer, playerx, playery, dead, won, lives, answered;
	var score = 0;
	var title = 0;
	var words = [
		['responsible', 'in', 'un', 'ir', 'il', 'im', 'dis', 3],
		['comfortable', 'anti', 'im', 'dis', 'non', 'un', 'in', 5],
		['legal', 'non', 'il', 'ir', 'un', 'im', 'dis', 2],
		['polite', 'dis', 'ir', 'il', 'im', 'um', 'non', 4],
		['academic', 'un', 'il', 'im', 'non', 'dis', 'ab', 4],
		['normal', 'mal', 'un', 'non', 'ab', 'dis', 'im', 4],
		['social', 'un', 'anti', 'dis', 'ab', 'dis', 'in', 2],
		['lingual', 'ub', 'a', 'un', 'bi', 'anti', 'il', 4],
		['adventurous', 'un', 'non', 'anti', 'ab', 'dis', 'an', 1],
		['married', 'un', 'in', 'il', 'anti', 'non', 'mis', 1]
	]

	function shuffle(a) {
		var j, x, i;
		for (i = a.length - 1; i > 0; i--) {
			j = Math.floor(Math.random() * (i + 1));
			x = a[i];
			a[i] = a[j];
			a[j] = x;
		}
		return a;
	}

	function game() {
		Q.audio.stop();
		Q.audio.play('background.mp3');
		title = 0;
		words = shuffle(words);
		dead = 0;
		score = 0;
		won = 0;
		timer = 50;
		time();
	}

	function time() {
		timer--;
		Q('UI.Text', 3).items[0].p.label = '' + timer;
		if ((timer > 0) & !dead & !won) {
			setTimeout(time, 1000);
		} else if (!won) {
			dead = 1;
			Q.stageScene('endGame', 2, {
				label: "Game Over"
			});
			Q('Player').destroy();
		}

	}

	function recreatePlayer() {
		Q.clearStage(1);
		player = Q.stage().insert(new Q.Player({
			x: playerx,
			y: playery
		}));
		Q.stage().add("viewport").follow(player);
	}

	var Q = window.Q = Quintus({
			audioSupported: ['mp3', 'ogg']
		})
		.include("Sprites, Scenes, Input, 2D, Anim, Touch, UI, Audio")
		.setup('myGame')
		.controls().touch().enableSound();

	var k = -1;

	window.addEventListener('keydown', function(key) {
		if (((key.which == 38) || (key.which == 40)) && Q.stage(1) && !answered) {
			k += key.which == 38 ? -1 : 1;
			k = k % 6;
			k = k < 0 ? 6 + k : k;
			for (i = 0; i < 6; i++) {
				if (k == i) Q('UI.Button', 1).items[i].p.asset = 'radio_filled.png';
				else Q('UI.Button', 1).items[i].p.asset = 'radio.png';
			}
			return;
		}

		if ((k > -1) && (key.which == 13) && Q.stage(1)) {
			var word_n;
			for (i = 0; i < words.length; i++) {
				if (words[i][0] == Q('UI.Text', 1).items[1].p.label) {
					word_n = i;
				}
			}

			if (!answered) {
				if (k == words[word_n][7] - 1) {
					Q('UI.Container', 1).items[1].p.fill = 'rgba(154, 236, 219,0.8)';
					timer += 5;
				} else {
					Q('UI.Container', 1).items[1].p.fill = 'rgba(255, 153, 148, 0.8)';
					timer -= 5;
				}
				if (timer > 1) setTimeout(recreatePlayer, 1000);
				answered = 1;
				k = -1;
			}
		}
		if ((key.which == 13) && Q.stage(2)) {
			dead = 1;
			Q.clearStages();
			Q.stageScene('level1');
			Q.stageScene('hud', 3);
			game();
		}
	});

	Q.Sprite.extend('Player', {
		init: function(p) {
			this._super(p, {
				sheet: 'player',
				sprite: 'player',
				x: 410,
				y: 1000,
				scale: 0.8,
				direction: 'right',
				jumpSpeed: -370
			});
			this.add('2d, platformerControls, animation, tween');
			this.on('jump');
			this.on('jumped');
			this.on("hit.sprite", function(collision) {
				if (collision.obj.isA("Question")) {
					this.destroy();
					playerx = this.p.x;
					playery = this.p.y;
				}
			});

		},

		jump: function(obj) {
			if (!obj.p.playedJump) {
				Q.audio.play('jump.mp3');
				obj.p.playedJump = true;
			}
		},

		jumped: function(obj) {
			obj.p.playedJump = false;
		},

		step: function(dt) {
			if (this.p.vx > 0) {
				if (this.p.landed > 0) {
					this.play("walk_right");
				} else {
					this.play("jump_right");
				}
				this.p.direction = "right";
			} else if (this.p.vx < 0) {
				if (this.p.landed > 0) {
					this.play("walk_left");
				} else {
					this.play("jump_left");
				}
				this.p.direction = "left";
			} else {
				this.play("stand_" + this.p.direction);
			}
		}

	});

	Q.Sprite.extend("Question", {
		init: function(p) {
			this._super(p, {
				sheet: 'question',
				num: 0,
				scale: 0.5
			});
			this.on("hit.sprite", function(collision) {
				Q.audio.play('coin.mp3');
				if (collision.obj.isA('Player')) {
					Q.stageScene('ask', 1, {
						word: words[this.p.num][0],
						ans1: words[this.p.num][1],
						ans2: words[this.p.num][2],
						ans3: words[this.p.num][3],
						ans4: words[this.p.num][4],
						ans5: words[this.p.num][5],
						ans6: words[this.p.num][6],
						correct: words[this.p.num][7]
					});
					this.destroy();
				}
			});
		}
	});

	Q.Sprite.extend("Finish", {
		init: function(p) {
			this._super(p, {
				sheet: 'finish',
				scale: 1
			});
			this.on("hit.sprite", function(collision) {
				if (collision.obj.isA('Player')) {
					won = 1;
					Q.stageScene("endGame", 1, {
						label: "You Won!"
					});
					Q('Player').destroy();
				}
			});
		}
	});

	Q.Sprite.extend("Enemy", {
		init: function(p) {
			this._super(p, {
				sheet: 'enemy',
				vx: 100
			});
			this.add('2d, aiBounce');
			this.on("bump.left,bump.right,bump.bottom", function(collision) {
				if (collision.obj.isA("Player")) {
					dead = 1;
					Q.stageScene("endGame", 2, {
						label: "Game Over"
					});
					collision.obj.destroy();
				}
			});

			this.on("bump.top", function(collision) {
				if (collision.obj.isA("Player")) {
					Q.audio.play('hit.mp3')
					this.destroy();
					collision.obj.p.vy = -300;
				}
			});
		}
	});

	Q.scene('title', function(stage) {
		title = 1;
		stage.insert(new Q.Repeater({
			asset: "background-wall2.jpg",
			speedX: 0.5,
			speedY: 0.5
		}));

		var container = stage.insert(new Q.UI.Container({
			x: Q.width / 2,
			y: Q.height / 2,
			fill: "rgba(0,0,0,0)"
		}));

		var button = container.insert(new Q.UI.Button({
			x: 0,
			y: 0,
			scale: 0.8,
			asset: 'start.png'
		}))
		container.insert(new Q.UI.Text({
			x: 0,
			y: 260,
			label: 'music by visager',
			align: 'center',
			weight: 100,
			size: 15,
			color: '#664f4f'
		}));

		button.on("click", function() {
			Q.clearStages();
			Q.stageScene('level1');
			Q.stageScene('hud', 3);
			game();
		});

		container.fit(20);
	});

	Q.scene('level1', function(stage) {

		stage.insert(new Q.Repeater({
			asset: "background-wall2.jpg",
			speedX: 0.5,
			speedY: 0.5
		}));

		stage.collisionLayer(new Q.TileLayer({
			dataAsset: 'level.json',
			sheet: 'tiles'
		}));

		var player = stage.insert(new Q.Player());

		stage.add("viewport").follow(player);

		stage.insert(new Q.Enemy({
			x: 1100,
			y: 1100
		}));
		stage.insert(new Q.Enemy({
			x: 1100,
			y: 960
		}));
		stage.insert(new Q.Enemy({
			x: 1300,
			y: 960
		}));
		stage.insert(new Q.Enemy({
			x: 1000,
			y: 740
		}));
		stage.insert(new Q.Enemy({
			x: 1300,
			y: 740
		}));
		stage.insert(new Q.Enemy({
			x: 1200,
			y: 480
		}));
		stage.insert(new Q.Enemy({
			x: 410,
			y: 480
		}));

		stage.insert(new Q.Question({
			x: 1790,
			y: 1050,
			num: 0
		}));
		stage.insert(new Q.Question({
			x: 740,
			y: 920,
			num: 1
		}));
		stage.insert(new Q.Question({
			x: 1480,
			y: 540,
			num: 2
		}));
		stage.insert(new Q.Question({
			x: 790,
			y: 60,
			num: 3
		}));
		stage.insert(new Q.Question({
			x: 215,
			y: 800,
			num: 4
		}));
		stage.insert(new Q.Question({
			x: 813,
			y: 380,
			num: 5
		}));
		stage.insert(new Q.Question({
			x: 530,
			y: 670,
			num: 6
		}));
		stage.insert(new Q.Question({
			x: 360,
			y: 350,
			num: 7
		}));
		stage.insert(new Q.Question({
			x: 1310,
			y: 257,
			num: 8
		}));
		stage.insert(new Q.Question({
			x: 1535,
			y: 65,
			num: 9
		}));

		stage.insert(new Q.Finish({
			x: 1775,
			y: 57
		}));
	});

	Q.scene('ask', function(stage) {
		var container0 = stage.insert(new Q.UI.Container({
			x: Q.width / 2,
			y: Q.height / 2,
			radius: 15
		}));

		container0.insert(new Q.UI.Text({
			x: 0,
			y: 230,
			label: 'Choose the right prefix.',
			color: '#685252',
			align: 'center',
			weight: 100,
			size: 30
		}));

		var container = stage.insert(new Q.UI.Container({
			x: Q.width / 2 + 40,
			y: Q.height / 2,
			fill: "rgba(255,255,255,0.8)",
			radius: 15
		}));


		var button1 = container.insert(new Q.UI.Button({
			x: -75,
			y: 0,
			asset: 'radio.png',
			scale: 0.7,
			n: 1
		}));
		var button2 = container.insert(new Q.UI.Button({
			x: -75,
			y: 30,
			asset: 'radio.png',
			scale: 0.7,
			n: 2
		}));
		var button3 = container.insert(new Q.UI.Button({
			x: -75,
			y: 60,
			asset: 'radio.png',
			scale: 0.7,
			n: 3
		}));
		var button4 = container.insert(new Q.UI.Button({
			x: -75,
			y: 90,
			asset: 'radio.png',
			scale: 0.7,
			n: 4
		}));
		var button5 = container.insert(new Q.UI.Button({
			x: -75,
			y: 120,
			asset: 'radio.png',
			scale: 0.7,
			n: 5
		}));
		var button6 = container.insert(new Q.UI.Button({
			x: -75,
			y: 150,
			asset: 'radio.png',
			scale: 0.7,
			n: 6
		}));

		var buttons = [button1, button2, button3, button4, button5, button6];
		var labels = [stage.options.ans1, stage.options.ans2, stage.options.ans3,
			stage.options.ans4, stage.options.ans5, stage.options.ans6
		];

		container.insert(new Q.UI.Text({
			x: -40,
			y: -60,
			label: stage.options.word,
			align: 'center',
			weight: 100
		}));
		answered = 0;
		var i;
		for (i = 0; i < 6; i++) {
			container.insert(new Q.UI.Text({
				x: -40,
				y: buttons[i].p.y - 17,
				label: labels[i],
				align: 'left',
				weight: 100
			}));
			buttons[i].on('click', function() {
				if (!answered) {
					this.p.asset = 'radio_filled.png';
					if (this.p.n == stage.options.correct) {
						container.p.fill = 'rgba(154, 236, 219,0.8)';
						timer += 5;
					} else {
						container.p.fill = 'rgba(255, 153, 148, 0.8)';
						timer -= 5;
					}
					if (timer > 1) setTimeout(recreatePlayer, 1000);
					answered = 1;
				}

			});
		}
		container.fit(20);
	});

	Q.scene('hud', function(stage) {
		var container = stage.insert(new Q.UI.Container({
			x: 20,
			y: 0,
		}))

		label = container.insert(new Q.UI.Text({
			x: 0,
			y: 0,
			label: '' + timer,
			color: '#664f4f',
			align: 'left',
			size: 60,
			weight: 100
		}))
	});

	Q.scene('endGame', function(stage) {
		var container = stage.insert(new Q.UI.Container({
			x: Q.width / 2,
			y: Q.height / 2,
			fill: "rgba(0,0,0,0)"
		}));

		var button = container.insert(new Q.UI.Button({
			x: 0,
			y: 0,
			asset: 'play_again.png',
			scale: 0.6
		}))
		var label = container.insert(new Q.UI.Text({
			x: 0,
			y: -100,
			label: stage.options.label,
			weight: 100,
			color: '#775c5c',
			size: 50
		}));

		button.on("click", function() {
			Q.clearStages();
			Q.stageScene('level1');
			Q.stageScene('hud', 3);
			game();
		});
		container.fit(20);
	});

	Q.load("start.png, finish.png, finish.json, play_again.png, level.json, tiles.png, background-wall2.jpg, radio.png, radio_filled.png, player.png, player.json, question.png, question.json, enemy.png, enemy.json, jump.mp3, hit.mp3, coin.mp3, background.mp3", function() {
		Q.sheet("tiles", "tiles.png", {
			tilew: 32,
			tileh: 32
		});
		Q.compileSheets("player.png", "player.json");
		Q.compileSheets("finish.png", "finish.json");
		Q.compileSheets("enemy.png", "enemy.json");
		Q.compileSheets("question.png", "question.json");
		Q.animations("player", {
			walk_right: {
				frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
				rate: 1 / 20,
				flip: false,
				loop: true
			},
			walk_left: {
				frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
				rate: 1 / 20,
				flip: "x",
				loop: true
			},
			jump_right: {
				frames: [12],
				rate: 1 / 10,
				flip: false
			},
			jump_left: {
				frames: [12],
				rate: 1 / 10,
				flip: "x"
			},
			stand_right: {
				frames: [11],
				rate: 1 / 10,
				flip: false
			},
			stand_left: {
				frames: [11],
				rate: 1 / 10,
				flip: "x"
			},
		});
		Q.stageScene('title', 2);
	});
});