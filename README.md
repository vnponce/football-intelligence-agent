# Football Intelligence Agent ⚽🤖

![AWS](https://img.shields.io/badge/AWS-Lambda-orange)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![Claude](https://img.shields.io/badge/AI-Claude%203.5-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

An AI-powered serverless agent that answers football (soccer) questions using AWS Lambda and Claude AI. Built as a learning project to explore serverless architectures and AI integration.

## 🎯 Live Demo - Try It Now!

```bash
curl -X POST https://p3ex1w73fg.execute-api.us-east-1.amazonaws.com/prod/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "When does Real Madrid play next?"}'
```

Other queries you can try:
- `"What's the score in the Arsenal match?"`
- `"Who is leading La Liga?"`
- `"Tell me about Manchester City's performance"`

## Overview

A serverless API that understands football-related questions and provides intelligent, conversational responses. Built with AWS CDK for infrastructure as code and designed to be cost-effective (~$6/month for 1000 requests).

## Architecture

```
User Query → API Gateway → Lambda Function → Claude AI
                              ↓
                        Football Data
                         Processing
```

### Key Components

- **AWS API Gateway**: RESTful API endpoint with rate limiting and CORS support
- **AWS Lambda**: Serverless compute running Node.js 18.x
- **Anthropic Claude API**: Advanced language model for natural response generation
- **AWS CDK**: Infrastructure as Code for reproducible deployments

## Features

- **Natural Language Queries**: Ask questions in plain English about matches, scores, and teams
- **Intent Detection**: Smart recognition of query types (next matches, live scores, standings)
- **Context-Aware Responses**: Combines structured data with AI-generated insights
- **Error Handling**: Graceful fallbacks with football-themed error messages
- **Production-Ready**: Rate limiting, logging, and monitoring built-in

## Example Queries

```
"When does Real Madrid play next?"
"What's the current score in the Arsenal match?"
"Show me the La Liga standings"
"How has Manchester City been performing?"
```

## Technical Stack

- **Infrastructure**: AWS CDK (TypeScript)
- **Runtime**: Node.js 18.x
- **AI Model**: Claude 3.5 Sonnet
- **Cloud Services**: Lambda, API Gateway, CloudWatch, Secrets Manager

## Getting Started

### Prerequisites

- AWS Account with appropriate permissions
- Node.js 18.x or higher
- AWS CLI configured with credentials
- AWS CDK CLI (`npm install -g aws-cdk`)
- Anthropic API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/vnponce/football-intelligence-agent.git
cd football-intelligence-agent
```

2. Install dependencies:
```bash
npm install
```

3. Set your Anthropic API key:
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

4. Deploy to AWS:
```bash
cdk deploy --profile your-aws-profile
```

### Testing

After deployment, test your agent:

```bash
curl -X POST https://your-api-url/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "When does Barcelona play next?"}'
```

## Cost Estimation

Estimated monthly costs for moderate usage (1,000 requests):
- API Gateway: ~$0.001
- Lambda: $0 (within free tier)
- Claude API: ~$5-6
- **Total: ~$6/month**

## Design Decisions

### Why Mock Data First?
Starting with hardcoded data allowed focus on:
- Core AI integration and response quality
- Infrastructure patterns and best practices
- Predictable demos and testing
- Faster iteration without external dependencies

### Why Anthropic Claude?
- Superior context understanding for sports queries
- Natural, engaging response generation
- Reliable API with good documentation
- Cost-effective for demonstration purposes

### Security Considerations
- API keys stored in environment variables (Secrets Manager ready)
- CORS configured for web access
- Rate limiting to prevent abuse
- Request validation and sanitization

## Future Enhancements

- [ ] Integration with live football data APIs
- [ ] Multi-language support
- [ ] Team-specific notification subscriptions
- [ ] Historical match analysis
- [ ] Prediction capabilities based on form data
- [ ] Voice interaction support

## Learning Outcomes

This project demonstrates:
- Building production-ready serverless applications
- Integrating AI services into practical applications
- Infrastructure as Code best practices
- Cost-conscious cloud architecture design
- Error handling and user experience in AI applications

## Contributing

Feel free to open issues or submit pull requests. Areas for contribution:
- Additional team/league data
- New query patterns and intents
- Performance optimizations
- Test coverage improvements

## License

MIT License - feel free to use this code for your own projects!

## Author

**Abel V.**  
Senior Full-Stack Engineer specializing in AWS and Applied AI

---

*Built with passion for football and technology ⚽❤️*