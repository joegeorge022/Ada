export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, xi-api-key',
          'Access-Control-Max-Age': '86400',
        }
      });
    }
    
    if (url.pathname === '/login.html' || url.pathname === '/auth.js') {
      return env.ASSETS.fetch(request);
    }
    
    if (url.pathname.startsWith('/api/')) {      
      if (url.pathname === '/api/clerk-webhook' && request.method === 'POST') {

        return new Response(JSON.stringify({ status: 'success' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (url.pathname === '/api/verify-session' && request.method === 'POST') {
        try {
          const authHeader = request.headers.get('Authorization');
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ 
              authenticated: false, 
              error: 'Invalid authorization header' 
            }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          const token = authHeader.substring(7);
          
          return new Response(JSON.stringify({ 
            authenticated: true,
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({ 
            authenticated: false, 
            error: error.message 
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      if (url.pathname.startsWith('/api/chat')) {
        if (request.method !== 'POST') {
          return new Response('Method not allowed', { status: 405 });
        }

        try {
          const body = await request.json();
          
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${env.GROQ_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: "llama3-70b-8192",
              messages: body.messages,
              temperature: 0.7,
              max_tokens: 800
            })
          });

          if (!response.ok) {
            throw new Error(`Groq API error: ${response.status}`);
          }

          const data = await response.json();
          return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: 'Failed to get response from Groq' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      if (url.pathname.startsWith('/api/elevenlabs-tts-debug')) {
        if (request.method !== 'POST') {
          return new Response('Method not allowed', { status: 405 });
        }

        try {
          const body = await request.json();
          const { text, voice_id } = body;
          
          if (!text || !voice_id) {
            return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
              status: 400,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            });
          }
          
          console.log('Available env vars:', Object.keys(env));
          console.log('ElevenLabs request received for voice:', voice_id);
          
          if (!env.ELEVENLABS_API_KEY) {
            return new Response(JSON.stringify({ 
              error: 'API key configuration error',
              details: 'ELEVENLABS_API_KEY is missing in environment variables' 
            }), {
              status: 500,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            });
          }
          
          const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`;
          
          console.log('Calling ElevenLabs API with stable endpoint');
          
          const requestBody = {
            text: text,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            }
          };
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'xi-api-key': env.ELEVENLABS_API_KEY,
              'Accept': 'audio/mpeg'
            },
            body: JSON.stringify(requestBody),
            cf: {
              cacheTtl: 0,
              cacheEverything: false,
              timeout: 30
            }
          });
          
          console.log('ElevenLabs response status:', response.status);
          
          if (!response.ok) {
            let errorText = '';
            try {
              errorText = await response.text();
            } catch (e) {
              errorText = 'Failed to extract error details';
            }
            
            console.error('ElevenLabs API detailed error:', errorText);
            
            return new Response(JSON.stringify({ 
              error: `ElevenLabs API error: ${response.status}`,
              details: errorText
            }), {
              status: response.status,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            });
          }
          
          const audioData = await response.arrayBuffer();
          console.log('Audio data received, size:', audioData.byteLength);
          
          return new Response(audioData, {
            headers: { 
              'Content-Type': 'audio/mpeg',
              'Access-Control-Allow-Origin': '*'
            }
          });
        } catch (error) {
          console.error('ElevenLabs request error:', error.message);
          
          return new Response(JSON.stringify({ 
            error: 'Failed to get response from ElevenLabs',
            details: error.message
          }), {
            status: 500,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      }
    }

    return env.ASSETS.fetch(request);
  }
}; 
