// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".

function ndashify(n) {
	return (n < 0) ? '−' + Math.abs(n) : n; // that's U+2212 MINUS SIGN
}

if (Meteor.isClient) {
	Meteor.startup(function() {
		Session.setDefault('locator', [{ type: 'tossups', index: 0 }]);
	});

	Template.leaderboard.teams = function () {
		var game = Games.findOne();
		if (!game) // We might not have synced yet...
			return;
		return Teams.find({ _id: { $in: game.teams } }); //{}, {sort: {name: 1}});
	};

	Template.reader.packet = function() {
		var game = Games.findOne();
		if (!game)
			return;
		var round = Rounds.findOne(game.round_id);
		return packet = Packets.findOne(round.packet_id);
	};
	Template.reader.type_index = function() {
		var l = Session.get('locator');
		console.log(l);
		if (!l) return;
		return l[0].index + 1;
	};
	Template.reader.type_length = function () {
		if (!Template.reader.packet())
			return;
		var l = Session.get('locator');
		return Template.reader.packet()[l[0].type].length;
	};

	Template.question.this_question = function() {
		if (!(Template.reader.packet()))
			return;
		var l = Session.get('locator');
		return Template.reader.packet()[l[0].type][l[0].index];
	};
	Template.question.isType = function(type) {
		if (!Session.get('locator'))
			return;
		return Session.get('locator')[0].type === type;
	};

	Template.team.score = function() {
		var players = Players.find({ 'team_id': this._id });
		var players_array = players.fetch(); // because Cursor doesn't have reduce, only fetch
		return ndashify(players_array.reduce(function(a, b) { return a + b.score; }, 0));
	};
	Template.team.players = function() {
		return Players.find({ 'team_id': this._id });
	};

	Template.player.score = function() {
		return ndashify(this.score);
	};
	Template.player.selected_name = function () {
		return Session.equals("selected_player", this._id);
	};
	Template.player.selected = function () {
		return Session.equals("selected_player", this._id) ? "selected" : '';
	};

	Template.leaderboard.events({
		'click input': function (event) {
			var trg = event.srcElement || event.target;
			//var points = +trg.dataset.points;
			var points = +trg.getAttribute('data-points');

			// Assuming that Session.get("selected_player") === this._id because the buttons only show up when player is selected
			Players.update(this._id, { $inc: { 'score': points } });
		}
	});

	Template.reader.events({
		'click input': function (event) {
			console.log(Session.get('locator'));
			var trg = event.srcElement || event.target;
			var inc = +trg.getAttribute('data-inc');

			var l = Session.get('locator');
			if (inc === -1) {
				if (l.length > 1)
					l.shift();
			}
			else if (inc === 1) {
				var next_different_than_cur = true;
				for (var m = 0; m < l.length; m ++)
					if ((l[m].type === l[0].type) == !next_different_than_cur)
						break;

				// If no previous questions of opposite type, use the first
				var new_loc;
				var num_questions = Template.reader.packet()[l[0].type].length;
				if (m >= l.length)
					new_loc = { type: l[0].type === 'bonuses' ? 'tossups' : 'bonuses', index: 0 };
				else {
					var new_index = l[m].index + inc;
					if (new_index < 0 || new_index > num_questions - 1)
						return;
					new_loc = { type: l[m].type, index: new_index };
				}
				l.unshift(new_loc);
			}

				

			// var cur_question = l[0];
			// var num_questions = Template.reader.packet()[l[0].type].length;
			
			// var new_index = l[0].index + inc;
			// console.log(l.cur, l[l.cur]+1, ' (',new_index+1,')');
			// if (new_index < 0) {
			// 	if (l.cur === 'tossups')
			// 		return;
			// }
			// else if (new_index > num_questions - 1) {
			// 	if (l.cur === 'bonuses')
			// 		return;
			// }
			// else
			// 	l[l.cur] = new_index;

			// l.cur = (l.cur === 'bonuses') ? 'tossups' : 'bonuses';
			// console.log('->',l.cur, l[l.cur]+1)
			Session.set('locator', l);
		}
	});

	Template.player.events({
		'click': function () {
			Session.set("selected_player", this._id);
		}
	});

	$(document).on('keydown', function(event) {
		
	});
}
