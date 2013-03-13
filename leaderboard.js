// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".

Teams = new Meteor.Collection("teams");
Players = new Meteor.Collection("players");

function ndashify(n) {
	return (n < 0) ? '−' + Math.abs(n) : n; // that's U+2212 MINUS SIGN
}

if (Meteor.isClient) {
	Template.leaderboard.teams = function () {
		return Teams.find(); //{}, {sort: {name: 1}});
	};

	Template.team.score = function() {
		var players = Players.find({ 'team_id': this._id });
		var players_array = players.map(function (v) { return v; }); // because Cursor doesn't have reduce, only map
		return ndashify(players_array.reduce(function(a, b) { return a + b.score; }, 0));
	};
	Template.team.players = function() {
		return Players.find({ 'team_id': this._id });
	}

	Template.player.score = function() {
		return ndashify(this.score);
	}
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
				var team_players = teams[i].players;
				delete teams[i].players;
				var team_id = Teams.insert(teams[i]);

				for (var j = 0; j < team_players.length; j ++) {
					team_players[j].team_id = team_id;
					team_players[j].score = 0;
					Players.insert(team_players[j]);
				}
			}
		}
	});
}
