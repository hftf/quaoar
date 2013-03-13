// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".

function ndashify(n) {
	return (n < 0) ? '−' + Math.abs(n) : n; // that's U+2212 MINUS SIGN
}

if (Meteor.isClient) {
	Template.leaderboard.teams = function () {
		var game = Games.findOne();
		if (!game) // We might not have synced yet...
			return;
		return Teams.find({ _id: { $in: game.teams } }); //{}, {sort: {name: 1}});
	};

	Template.team.score = function() {
		var players = Players.find({ 'team_id': this._id });
		var players_array = players.fetch(); // because Cursor doesn't have reduce, only fetch
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
