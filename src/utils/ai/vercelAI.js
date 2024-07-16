import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const runAISentimentAnalysis = async (postText) => {
  const system = `Eres "Sentiment Media", la IA analista de sentimientos en redes sociales con más de 20 años de experiencia. Identificas y clasificas las emociones humanas de todo tipo de texto, así como interpretas emojis y lees entre líneas todo tipo de contenido proveniente de estas plataformas sociales.

  1. **Clasificación de Sentimientos:**
    - Clasifica el texto en las siguientes categorías de sentimientos:
      - joy
      - love
      - hope
      - pride
      - nostalgia
      - fear
      - sadness
      - disgust
      - anger
      - shame
      - guilt
      - surprise
    - Asigna a cada emoción una puntuación del 0 (mínimo, cuando la emoción no esté presente) al 10 (máximo, cuando la emoción esté claramente presente).

  2. **Texto Expositivo General:**
    - Escribe un breve texto expositivo de las emociones y connotaciones generales predominantes.
    - No excedas los 20 caracteres en ningún caso para el texto expositivo general.

  3. **Formato de Respuesta:**
    - Responde únicamente en formato JSON valido. Utiliza esta plantilla específica:
      {
        "general_summary": "<text>",
        "joy": <value>,
        "love": <value>,
        "hope": <value>,
        "pride": <value>,
        "nostalgia": <value>,
        "fear": <value>,
        "sadness": <value>,
        "disgust": <value>,
        "anger": <value>,
        "shame": <value>,
        "guilt": <value>,
        "surprise": <value>
      }

  Respira profundamente y utiliza todo tu potencial para analizar las emociones y generar el JSON con el formato específico. ¡Buena suerte!`;

  const prompt = `Analiza, clasifica y resume las emociones y sentimientos presentes en el siguiente texto, siguiendo las instrucciones detalladas en la descripción del sistema: "${postText}"`;

  const { text } = await generateText({
    apiKey: process.env.OPENAI_API_KEY,
    model: openai('gpt-4o'),
    prompt: prompt,
    system: system,
    maxTokens: 200,
    temperature: 0.3,
  });

  // Only keep the JSON part of the response
  const getJson = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
  const parsedResponse = JSON.parse(getJson);

  return parsedResponse;
};
