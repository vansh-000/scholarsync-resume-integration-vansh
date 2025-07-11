import { generateProjectSuggestions } from '@/lib/utils/generateSuggestions';
import cors from '@/lib/middleware/cors';
import applyRateLimit from '@/lib/middleware/rateLimit';
import { verifyCSRFToken } from '@/lib/middleware/csrf';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  await cors(req, res);
  await applyRateLimit(req, res);

  const secret = process.env.CSRF_SECRET ;
  const csrfToken = req.headers['x-csrf-token'];
   console.log('CSRF Token:', csrfToken);
  console.log("Token verfiication", verifyCSRFToken(secret, csrfToken));

  if (!csrfToken || !verifyCSRFToken(secret, csrfToken)) {
    console.log("Invalid CSRF token");
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { resumeData, scholarData } = req.body;

  if (!resumeData && !scholarData) {
    return res.status(400).json({ error: 'Either resume or scholar data is required' });
  }

  try {
    const suggestions = await generateProjectSuggestions(resumeData, scholarData);

    console.log('Generated suggestions:', suggestions?.length ?? 0);

    res.status(200).json({
      success: true,
      data: suggestions,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Suggestion generation error:', err);
    res.status(500).json({
      error: 'Failed to generate project suggestions',
      details: err.message || 'Unknown error',
    });
  }
}
