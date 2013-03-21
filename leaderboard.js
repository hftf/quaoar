// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".

function ndashify(n) {
	return (n < 0) ? '−' + Math.abs(n) : n; // that's U+2212 MINUS SIGN
}

if (Meteor.isClient) {
	Meteor.startup(function() {
		Meteor.autorun(function () {
			if (!Session.get('game')) {
				var game = Games.findOne();
				if (game) {
					Session.set('game', game);
				}
			}
		});
		Session.setDefault('locator', [{ type: 'tossups', index: 0 }]);
	});

	Handlebars.registerHelper('time', function(datetime) {
		var dateObj = new Date(datetime);
		//return $.timeago(dateObj);
		return dateObj.toTimeString().substring(0,5);
	});

	Template.leaderboard.teams = function () {
		if (!Session.get('game')) // We might not have synced yet...
			return;
		return Teams.find({ _id: { $in: Session.get('game').teams } }); //{}, {sort: {name: 1}});
	};

	Template.reader.packet = function() {
		if (!Session.get('game'))
			return;
		var round = Rounds.findOne(Session.get('game').round_id);
		if (!round)
			return;
		return Packets.findOne(round.packet_id);
	};
	Template.reader.selected = function() {
		var l = Session.get('locator');
		var selected_question = Template.reader.packet()[l[0].type][l[0].index];
		return _.isEqual(selected_question, this) ? 'selected' : '';
	};

	Template.nav.type = function(type) {
		if (!Session.get('locator'))
			return;
		return Session.get('locator')[0].type;
	};
	Template.nav.type_index = function() {
		var l = Session.get('locator');
		if (!l) return;
		return l[0].index + 1;
	};
	Template.nav.type_length = function () {
		if (!Template.reader.packet())
			return;
		var l = Session.get('locator');
		return Template.reader.packet()[l[0].type].length;
	};
	Template.nav.Events = function() {
		if (!Session.get('game'))
			return;
		var _id = Session.get('game')._id;
		return Events.find({ 'game_id': _id }, { sort: { datetime: -1 } }).fetch().slice(0,2);
	};

	Template.event.player = function() {
		if (!Players.findOne(this.player_id))
			return;
		return Players.findOne(this.player_id).name;
	};
	Template.event.pointed = function() {
		switch (this.inc) {
			case -5: return 'negged'; break;
		//	case 10: return 'tenned'; break;
			case 15: return 'powered'; break;
			default: return ndashify(this.inc) + '’d';
		}
	};
	Template.event.question = function() {
		if (!Template.reader.packet())
			return;
		var l = this.location;
		var answer = Template.reader.packet()[l.type][l.index].answer;
		if (answer.indexOf(' [') !== -1)
			return answer.substring(0, answer.indexOf(' ['));
		return answer;
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
		return Session.equals('selected_player', this._id);
	};
	Template.player.selected = function () {
		return Session.equals('selected_player', this._id) ? 'selected' : '';
	};

	Template.player.events({
		'click input': function (event) {
			var trg = event.srcElement || event.target;
			//var points = +trg.dataset.points;
			var inc = +trg.getAttribute('data-points');

			// Assuming that Session.get("selected_player") === this._id because the buttons only show up when player is selected
			Players.update(this._id, { $inc: { 'score': inc } });

			var g = Session.get('game');
			var l = Session.get('locator');
			var new_event = { game_id: g._id, player_id: this._id, inc: inc, location: l[0], datetime: new Date };
			Events.insert(new_event);

			// g.events.unshift(new_event);
			//Session.set('game', g);
		},
		'click': function () {
			if (Session.get('locator')[0].type !== 'tossups')
				return;

			Session.set('selected_player', this._id);
		}
	});

	//✅✓✔✕✖✗✘✩❌❎★☆
	Template.nav.events({
		'click input': function (event) {
			var trg = event.srcElement || event.target;
			var inc = +trg.getAttribute('data-inc');

			var l = Session.get('locator');
			if (inc === -1) {
				if (l.length > 1)
					l.shift();
			}
			else if (inc === 1) {
				var next_same_as_cur = trg.getAttribute('data-skip') === null;
				for (var m = 0; m < l.length; m ++)
					if ((l[m].type === l[0].type) == !next_same_as_cur)
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
			if (l[0].type === 'bonuses')
				Session.set('selected_player', null);

				

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

	$(document).on('keydown', function(event) {
		
	});
}
