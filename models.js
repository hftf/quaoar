Teams = new Meteor.Collection("teams");
Players = new Meteor.Collection("players");

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
