const Anthropic = require('@anthropic-ai/sdk');

// Mock football data - in a real application, this would come from a database or API
const FOOTBALL_DATA = {
  teams: {
    "real_madrid": {
      name: "Real Madrid",
      league: "La Liga",
      position: 1,
      points: 45,
      nextMatch: {
        opponent: "Barcelona",
        date: "January 15, 2025",
        time: "21:00 CET",
        venue: "Santiago Bernabéu"
      },
      topScorer: { name: "Vinícius Jr.", goals: 12 },
      recentForm: "WWDWW"
    },
    "manchester_city": {
      name: "Manchester City",
      league: "Premier League",
      position: 1,
      points: 48,
      nextMatch: {
        opponent: "Liverpool",
        date: "January 14, 2025",
        time: "16:30 GMT",
        venue: "Etihad Stadium"
      },
      topScorer: { name: "Erling Haaland", goals: 18 },
      recentForm: "WWWDW"
    },
    "barcelona": {
      name: "FC Barcelona",
      league: "La Liga",
      position: 2,
      points: 42,
      nextMatch: {
        opponent: "Real Madrid",
        date: "January 15, 2025",
        time: "21:00 CET",
        venue: "Santiago Bernabéu"
      },
      topScorer: { name: "Robert Lewandowski", goals: 15 },
      recentForm: "WDWWD"
    }
  },
  liveMatches: [
    {
      matchId: "match_001",
      competition: "Premier League",
      home: "Arsenal",
      away: "Chelsea",
      score: "2-1",
      minute: 73,
      status: "LIVE",
      events: [
        { minute: 15, type: "goal", player: "Saka", team: "Arsenal" },
        { minute: 38, type: "goal", player: "Palmer", team: "Chelsea" },
        { minute: 67, type: "goal", player: "Ødegaard", team: "Arsenal" }
      ]
    }
  ]
};

// Helper function to detect football-related intents from user queries
function detectFootballIntent(query) {
  const lowerQuery = query.toLowerCase();
  
  // Define patterns for different types of queries
  const intents = {
    nextMatch: {
      patterns: [/when.*play/, /next match/, /next game/, /upcoming/],
      requiresTeam: true
    },
    liveScore: {
      patterns: [/score/, /result/, /how.*doing/, /winning/],
      requiresTeam: false
    },
    standings: {
      patterns: [/table/, /standings/, /position/, /league leader/, /points/],
      requiresTeam: false
    }
  };
  
  // Extract team names from the query
  const teamPatterns = /(real madrid|barcelona|manchester city|liverpool|arsenal|chelsea)/i;
  const teamMatch = lowerQuery.match(teamPatterns);
  
  // Find which intent matches the query
  for (const [intentName, config] of Object.entries(intents)) {
    for (const pattern of config.patterns) {
      if (pattern.test(lowerQuery)) {
        return {
          intent: intentName,
          team: teamMatch ? teamMatch[1].toLowerCase().replace(' ', '_') : null
        };
      }
    }
  }
  
  return null;
}

// Process football queries and extract relevant context
function processFootballQuery(intent) {
  let context = "";
  
  switch(intent.intent) {
    case 'nextMatch':
      if (intent.team && FOOTBALL_DATA.teams[intent.team]) {
        const team = FOOTBALL_DATA.teams[intent.team];
        context = `Next match: ${team.name} vs ${team.nextMatch.opponent} on ${team.nextMatch.date} at ${team.nextMatch.time} at ${team.nextMatch.venue}. Recent form: ${team.recentForm}`;
      }
      break;
      
    case 'liveScore':
      const liveMatch = FOOTBALL_DATA.liveMatches[0];
      if (liveMatch) {
        context = `Live match: ${liveMatch.home} ${liveMatch.score} ${liveMatch.away} (${liveMatch.minute}'). Competition: ${liveMatch.competition}`;
      }
      break;
      
    case 'standings':
      // Show top teams from both leagues
      const laLigaTeams = Object.values(FOOTBALL_DATA.teams)
        .filter(t => t.league === "La Liga")
        .sort((a, b) => b.points - a.points)
        .slice(0, 3);
      
      context = `La Liga standings: ${laLigaTeams.map((t, i) => `${i+1}. ${t.name} (${t.points} pts)`).join(', ')}`;
      break;
  }
  
  return context;
}

// Main Lambda handler
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    // Parse the incoming request
    const body = JSON.parse(event.body);
    const userQuery = body.query;
    
    if (!userQuery) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Missing query parameter'
        })
      };
    }
    
    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    // Detect football intent and get context
    const footballIntent = detectFootballIntent(userQuery);
    let footballContext = "";
    
    if (footballIntent) {
      footballContext = processFootballQuery(footballIntent);
      console.log('Detected intent:', footballIntent.intent);
      console.log('Football context:', footballContext);
    }
    
    // Prepare the system prompt
    const systemPrompt = `You are a knowledgeable football (soccer) assistant with access to current match data and team information. 
    You provide accurate, engaging information about matches, players, and teams. 
    Keep responses concise but informative, and add relevant insights when possible.
    If you don't have specific data about a team or match, acknowledge this honestly.`;
    
    // Create the user prompt with context if available
    const userPrompt = footballContext 
      ? `User question: ${userQuery}\n\nCurrent football data: ${footballContext}`
      : userQuery;
    
    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    });
    
    // Return successful response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        response: message.content[0].text,
        metadata: {
          intent: footballIntent?.intent || 'general',
          hasContext: !!footballContext
        }
      })
    };
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    // Handle specific error types
    if (error.message?.includes('anthropic')) {
      return {
        statusCode: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'The AI assistant is temporarily offside. Please try again later!',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        })
      };
    }
    
    // Generic error response
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};