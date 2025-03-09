export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle API requests
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

    // Handle ElevenLabs TTS API
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
        
        // Call ElevenLabs API with the API key from environment
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
        
        // Get the audio data and pass it through
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

    // Handle ElevenLabs Debug API with more stable endpoint
    if (url.pathname.startsWith('/api/elevenlabs-tts-debug')) {
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
        
        if (!env.ELEVENLABS_API_KEY) {
          return new Response(JSON.stringify({ error: 'API key configuration error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Use the standard TTS endpoint instead of streaming
        const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`;
        
        const requestBody = {
          text: text,
          model_id: model_id || "eleven_monolingual_v1",
          voice_settings: voice_settings || {
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
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          return new Response(JSON.stringify({ 
            error: `ElevenLabs API error: ${response.status}`,
            details: errorText
          }), {
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Get the audio data and pass it through
        const audioData = await response.arrayBuffer();
        
        return new Response(audioData, {
          headers: { 'Content-Type': 'audio/mpeg' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: 'Failed to get response from ElevenLabs',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Handle Hume AI WebSocket upgrade
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

    // Serve static files
    return env.ASSETS.fetch(request);
  }
}; 