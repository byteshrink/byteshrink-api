# ByteShrink AI API

Serverless backend for analyzing `package.json` files using LLMs via OpenRouter.

## Features

- Vercel serverless function at `/api/optimize`
- Accepts `dependencies` and `devDependencies` in JSON
- Uses OpenRouter to generate suggestions
- Written in TypeScript

## Deployment

1. Deploy to Vercel and select the `Other` framework preset
2. Set environment variable: `OPENROUTER_API_KEY=sk-…`
3. Call your endpoint:
    POST https://api.byteshrink.dev/api/optimize
4. Payload:
```json
{
  "dependencies": { "lodash": "^4.17.21" },
  "devDependencies": { "webpack": "^5.75.0" }
}
```