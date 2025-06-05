export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Only POST allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { dependencies, devDependencies } = body;

    if (!dependencies && !devDependencies) {
      return new Response(JSON.stringify({ error: 'Missing dependencies in request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = buildPrompt(dependencies, devDependencies);
    console.log('Sending prompt to OpenRouter:', prompt);

    const model = req.headers.get('x-model') || 'deepseek/deepseek-r1:free';

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://byteshrink.dev',
        'X-Title': 'ByteShrink API'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      }),
    });

    const json = await response.json();
    
    const reply = json?.choices?.[0]?.message?.content;

    if (!reply) {
      console.error('⚠️ No usable content in LLM response:', JSON.stringify(json, null, 2));
      return new Response(JSON.stringify({ error: 'Empty or malformed LLM response' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ suggestions: reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('💥 Error in API handler:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function buildPrompt(deps: Record<string, string>, devDeps: Record<string, string>): string {
  const depList = JSON.stringify(deps ?? {}, null, 2);
  const devDepList = JSON.stringify(devDeps ?? {}, null, 2);

  return `
You are a JavaScript optimization expert. Analyze this package.json and return bundle size and performance suggestions.

Dependencies:
\`\`\`json
${depList}
\`\`\`

DevDependencies:
\`\`\`json
${devDepList}
\`\`\`

Suggest:
- unnecessary packages
- heavy packages with lighter alternatives
- outdated packages with better performance in newer versions
- anything else that will reduce JS bundle size or install footprint

Reply in clear markdown. Avoid code unless necessary.
`;
}