Schools = new Meteor.Collection("schools");
Teams = new Meteor.Collection("teams");
Players = new Meteor.Collection("players");

 Buzzers = new Meteor.Collection("buzzers");
 Moderators = new Meteor.Collection("moderators");


Sets = new Meteor.Collection("sets");
Packets = new Meteor.Collection("packets");

Venues = new Meteor.Collection("venues");
Tournaments = new Meteor.Collection("tournaments");
Stages = new Meteor.Collection("stages");
Brackets = new Meteor.Collection("brackets");

Rounds = new Meteor.Collection("rounds");
Locations = new Meteor.Collection("locations");
Games = new Meteor.Collection("games");

Events = new Meteor.Collection("events");


Players.allow({
	update: function (userId, event, fields, modifier) {
		return userId;
	}
});
Events.allow({
	insert: function (userId, event) {
		return userId;
		//return Moderators.findOne({ 'game_id': event.game_id, 'user_id': userId });
	}
});
if (Meteor.isServer) {
	Meteor.publish('allUserData', function () {
		return Meteor.users.find({}, { fields: { 'locator': true, 'emails': true } });
	});
}
Meteor.users.allow({
	update: function (userId, user, fields, modifier) {
		return true;
		return userId === user._id;
	}
});


// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
	Meteor.startup(function () {
		if (Teams.find().count() === 0) {

			// Add schools, teams, players
			var schools = [
				{ name: 'UMD', teams: [
				//	{ name: 'UMD A', players: [ { name: 'Chris Ray' }, { name: 'Brian McPeak' }, { name: 'Arun Chonai' }, { name: 'Chris Manners' } ] },
					{ name: 'UMD B', players: [ { name: 'Isaac Hirsch' }, { name: 'Gary Weiser' }, { name: 'Ophir Lifshitz' }, { name: 'Dan Puma' } ] },
				] },
				{ name: 'Penn', teams: [
					{ name: 'Penn', players: [ { name: 'Eric Mukherjee' }, { name: 'Patrick Liao' }, { name: 'Saajid Moyen' }, { name: 'Dallas Simons' } ] },
				] },
				{ name: 'VCU', teams: [
					{ name: 'VCU', players: [ { name: 'Cody Voight' }, { name: 'Sean Smiley' }, { name: 'Stas Shuparskyy' } ] },
				]}
			];
			
			for (var h = 0; h < schools.length; h ++) {
				var teams = schools[h].teams;
				delete schools[h].teams;
				var school_id = Schools.insert(schools[h]);

				for (var i = 0; i < teams.length; i ++) {
					var players = teams[i].players;
					delete teams[i].players;
					teams[i].school_id = school_id;
					var team_id = Teams.insert(teams[i]);

					for (var j = 0; j < players.length; j ++) {
						players[j].team_id = team_id;
						players[j].score = 0;
						Players.insert(players[j]);
					}
				}
			}


			// Add sets, packets
			var set_id; // We'll need this when we make the tournament
			var round; // For convenience when we make the round
			for (var k = 0; k < sets.length; k ++) {
				var packets = sets[k].packets;
				delete sets[k].packets;
				set_id = Sets.insert(sets[k]); // no 'var'

				for (var l = 0; l < packets.length; l ++) {
					packets[l].set_id = set_id;
					packet_id = Packets.insert(packets[l]);

					// Again, this is only here because there's only one round
					round = { packet_id: packet_id, name: packets[l].round };
				}
			}

			// Add venues, tournaments, stages, brackets
			var venues = [
				{ name: 'University of Virginia', tournaments: [
					{ name: 'ACF Fall 2011', set_id: set_id, stages: [ // using set_id from above
						{ name: 'Prelims', brackets: [
							{ name: 'First prelim bracket' },
							{ name: 'Second prelim bracket' }
						] },
						{ name: 'Playoffs', brackets: [
							{ name: 'Top playoff bracket' },
							{ name: 'Bottom playoff bracket' }
						] }
					] }
				] }
			];
			for (var m = 0; m < venues.length; m ++) {
				var tournaments = venues[m].tournaments;
				delete venues[m].tournaments;
				var venue_id = Venues.insert(venues[m]);

				for (var n = 0; n < tournaments.length; n ++) {
					var stages = tournaments[n].stages;
					delete tournaments[n].stages;
					tournaments[n].venue_id = venue_id;
					var tournament_id = Tournaments.insert(tournaments[n]);

					for (var o = 0; o < stages.length; o ++) {
						var brackets = stages[o].brackets;
						delete stages[o].brackets;
						stages[o].tournament_id = tournament_id;
						var stage_id = Stages.insert(stages[o]);

						for (var p = 0; p < brackets.length; p ++) {
							brackets[p].stage_id = stage_id;
							Brackets.insert(brackets[p]);
						}
					}
				}
			}

			// Adding a round
			var bracket_id = Brackets.findOne()._id;
			round.bracket_id = bracket_id;
			var round_id = Rounds.insert(round);

			// Adding a location
			var location = { bracket_id: bracket_id, name: 'The only room' };
			var location_id = Locations.insert(location);

			// Adding a game
			var team1_id = Teams.findOne({ name: 'UMD B' })._id;
			var team2_id = Teams.findOne({ name: 'VCU' })._id;
			var game = { round_id: round_id, location_id: location_id, teams: [ team1_id, team2_id ] };
			Games.insert(game);

		}
	});
}
