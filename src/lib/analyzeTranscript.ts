import type { TranscriptAnalysis } from '@/types'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

export async function analyzeTranscript(
  transcriptContent: string,
  candidateName: string,
  position: string | null
): Promise<TranscriptAnalysis> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  if (!apiKey) {
    throw new Error('Anthropic API key not configured. Add VITE_ANTHROPIC_API_KEY to your .env file.')
  }

  const systemPrompt = `You are an expert hiring manager analyzing interview transcripts. Your job is to provide objective, actionable insights about candidates based on their interview conversations.

Analyze the transcript and provide:
1. A brief summary (2-3 sentences) of the interview
2. Key points discussed (3-5 bullet points)
3. Candidate strengths observed (2-4 points)
4. Concerns or areas to probe further (2-4 points)
5. A brief hiring recommendation

Be specific and reference actual quotes or moments from the transcript when possible.`

  const userPrompt = `Analyze this interview transcript for candidate "${candidateName}"${position ? ` applying for the ${position} position` : ''}.

TRANSCRIPT:
${transcriptContent}

Respond in JSON format with this exact structure:
{
  "summary": "Brief 2-3 sentence summary of the interview",
  "key_points": ["point 1", "point 2", "point 3"],
  "strengths": ["strength 1", "strength 2"],
  "concerns": ["concern 1", "concern 2"],
  "recommendation": "Your brief hiring recommendation"
}`

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Anthropic API error: ${error}`)
  }

  const data = await response.json()
  const content = data.content[0]?.text

  if (!content) {
    throw new Error('No response from Anthropic API')
  }

  // Parse the JSON response
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Could not parse AI response')
  }

  const parsed = JSON.parse(jsonMatch[0])

  return {
    summary: parsed.summary || '',
    key_points: parsed.key_points || [],
    strengths: parsed.strengths || [],
    concerns: parsed.concerns || [],
    recommendation: parsed.recommendation || '',
    analyzed_at: new Date().toISOString(),
  }
}
