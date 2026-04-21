import Route from '@ember/routing/route';

const FEEDS = [
    {
        source: 'FIFA',
        title: 'Official FIFA World Cup 26 news hub',
        url: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/news',
        summary: 'Fixture announcements, travel information and match recaps direct from the tournament organiser.'
    },
    {
        source: 'BBC Sport',
        title: 'BBC coverage of the 2026 World Cup',
        url: 'https://www.bbc.com/sport/football/world-cup',
        summary: 'Live blogs, match reports and tactical analysis from the BBC Sport football desk.'
    },
    {
        source: 'ESPN',
        title: 'ESPN FC 2026 World Cup hub',
        url: 'https://www.espn.com/soccer/fifa-world-cup',
        summary: 'US-focused reporting, interviews and opinion covering all 48 nations.'
    },
    {
        source: 'The Guardian',
        title: 'Guardian Football World Cup coverage',
        url: 'https://www.theguardian.com/football/world-cup-football',
        summary: 'Long-form features, match ratings and the daily World Cup briefing email.'
    },
    {
        source: 'CONCACAF',
        title: 'Host confederation updates',
        url: 'https://www.concacaf.com/',
        summary: 'News from the host confederation covering Canada, Mexico and the United States.'
    }
];

export default Route.extend({
    model() {
        return FEEDS;
    }
});
