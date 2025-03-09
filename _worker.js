export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle CORS preflight requests
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

    if (url.pathname.startsWith('/api/elevenlabs-tts')) {
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
      }

      try {
        const body = await request.json();
        const { text, voice_id, model_id, voice_settings } = body;
        
        if (!text || !voice_id) {
          return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}/stream-input?optimize_streaming_latency=0`;
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': env.ELEVENLABS_API_KEY
          },
          body: JSON.stringify({
            text: text,
            model_id: model_id || "eleven_monolingual_v1",
            voice_settings: voice_settings || {
              stability: 0.5,
              similarity_boost: 0.75
            }
          })
        });
        
        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${response.status}`);
        }
        
        const audioData = await response.arrayBuffer();
        
        return new Response(audioData, {
          headers: { 'Content-Type': 'audio/mpeg' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to get response from ElevenLabs' }), {
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
        const { text, voice_id, model_id, voice_settings } = body;
        
        console.log('ElevenLabs request received:', {
          textLength: text?.length,
          voice_id,
          hasApiKey: env.ELEVENLABS_API_KEY ? 'Yes (length: ' + env.ELEVENLABS_API_KEY.length + ')' : 'No',
        });
        
        if (!text || !voice_id) {
          return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        if (!env.ELEVENLABS_API_KEY) {
          console.error('ELEVENLABS_API_KEY is missing in environment variables');
          return new Response(JSON.stringify({ 
            error: 'API key configuration error',
            details: 'ELEVENLABS_API_KEY is missing in environment variables' 
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`;
        
        console.log('Calling ElevenLabs API:', apiUrl);
        
        const requestBody = {
          text: text,
          model_id: model_id || "eleven_monolingual_v1",
          voice_settings: voice_settings || {
            stability: 0.5,
            similarity_boost: 0.75
          }
        };
        
        const headers = {
          'Content-Type': 'application/json',
          'xi-api-key': env.ELEVENLABS_API_KEY,
          'Accept': 'audio/mpeg'
        };
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(requestBody)
        });
        
        console.log('ElevenLabs response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('ElevenLabs API detailed error:', errorText);
          
          return new Response(JSON.stringify({ 
            error: `ElevenLabs API error: ${response.status}`,
            details: errorText || 'No details available from ElevenLabs API'
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
        console.error('ElevenLabs request error:', error.message, error.stack);
        
        return new Response(JSON.stringify({ 
          error: 'Failed to get response from ElevenLabs',
          details: error.message,
          stack: error.stack
        }), {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    if (url.pathname.startsWith('/api/hume-ws')) {
      const humeResponse = await fetch('https://api.hume.ai/v0/stream/evi', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${env.HUME_API_KEY}`,
          'Upgrade': request.headers.get('Upgrade'),
          'Connection': request.headers.get('Connection')
        }
      });
      
      if (humeResponse.ok) {
        return new Response(null, {
          status: 101,
          webSocket: humeResponse.webSocket
        });
      }
      
      return new Response('Failed to establish WebSocket connection', { status: 500 });
    }

    return env.ASSETS.fetch(request);
  }
}; 