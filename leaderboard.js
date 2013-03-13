// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".

Teams = new Meteor.Collection("teams");

function ndashify(n) {
	return (n < 0) ? '−' + Math.abs(n) : n; // that's U+2212 MINUS SIGN
}

if (Meteor.isClient) {
	Template.leaderboard.teams = function () {
		return Teams.find(); //{}, {sort: {name: 1}});
	};

	Template.team.score = function() {
		return ndashify(this.players.reduce(function(a, b) { return a + b.score; }, 0));
	};

	Template.player.score = function() {
		return ndashify(this.score);
	}
	Template.player.selected_name = function () {
		return Session.equals("selected_player", this._id);
		var player = Teams.findOne(Session.get("selected_player"));
		return player && player.name;
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
			// https://github.com/meteor/meteor/blob/master/examples/parties/model.js#L123
			var team = Teams.findOne({ 'players._id': this._id });
			var players = _.pluck(team.players, '_id');
			for (var p = 0; p < players.length; p ++)
				if (players[p].equals(this._id))
					break;
			var modifier = { $inc: {} }
			modifier.$inc['players.' + p + '.score'] = points;

			Teams.update({ 'players._id': this._id }, modifier);
		}
	});

	Template.player.events({
		'click': function () {
			Session.set("selected_player", this._id);
		}
	});
}

// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
	Meteor.startup(function () {
		if (Teams.find().count() === 0) {

			var teams = [
					{ name: 'UMD A', players: [ { name: 'Chris Ray' }, { name: 'Brian McPeak' }, { name: 'Arun Chonai' }, { name: 'Chris Manners' } ] },
					{ name: 'UMD B', players: [ { name: 'Isaac Hirsch' }, { name: 'Gary Weiser' }, { name: 'Ophir Lifshitz' }, { name: 'Dan Puma' } ] },
			];
			
			for (var i = 0; i < teams.length; i ++) {
				for (var j = 0; j < teams[i].players.length; j ++) {
					teams[i].players[j]._id = new Meteor.Collection.ObjectID();
					teams[i].players[j].score = 0;
				}
				Teams.insert(teams[i]);
			}
		}
	});
}
