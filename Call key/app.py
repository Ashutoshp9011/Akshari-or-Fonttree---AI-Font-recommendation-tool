# --- File: app.py (Your Python Backend) ---
import os
import json
import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS

# --- Basic Setup ---
app = Flask(__name__)
# Enable CORS to allow your Chrome extension to make requests to this server
CORS(app) 
os.environ['GOOGLE_API_KEY'] = 'AIzaSyAuewQZazMOIori-x9N8UStd9TGX6R5198'
# --- AI Configuration ---
try:
    # IMPORTANT: Load your Google AI API key from an environment variable for security
    GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY environment variable not set.")
    
    genai.configure(api_key=GOOGLE_API_KEY)
    # Use a modern, fast, and cost-effective model like gemini-1.5-flash
    model = genai.GenerativeModel('gemini-1.5-flash')
    print("Google AI client configured successfully.")

except (ValueError, TypeError) as e:
    print(f"Error configuring Google AI: {e}")
    model = None # Set model to None if configuration fails

# --- API Route Definition ---
@app.route('/analyze-design', methods=['POST'])
def analyze_design_route():
    """This is the main endpoint that receives data from the Chrome extension."""

    # Check if the AI model was configured correctly on startup
    if not model:
        return jsonify({"error": "Server is not configured with a valid Google AI API key."}), 500

    # Get the JSON data sent from the extension's background script
    data = request.get_json()
    if not data or 'fullText' not in data or not data['fullText'].strip():
        return jsonify({"error": "The 'fullText' field is required for analysis."}), 400

    # Extract data with default values
    doc_type = data.get('docType', 'a design')
    heading = data.get('heading', 'N/A')
    full_text = data.get('fullText')
    used_fonts = data.get('usedFonts', [])

    # --- Construct the Prompt for the Gemini Model ---
    prompt = f"""
        You are an expert design assistant integrated directly into a design tool like Canva.
        Your task is to analyze a user's design based on its text and the fonts they are using.

        DESIGN CONTEXT:
        - Document Type: "{doc_type}"
        - Main Heading: "{heading}"
        - Full Text Content: "{full_text}"
        - Fonts Currently Used: {', '.join(used_fonts) if used_fonts else 'None'}

        YOUR TASKS:
        1.  Determine the primary 'Purpose' of the design from the text (e.g., "Promoting a summer sale").
        2.  Determine the primary 'Mood' of the design from the text (e.g., "Playful", "Formal", "Urgent").
        3.  Evaluate each font from the 'Fonts Currently Used' list. Rate it as "Good" or "Not Ideal" for the design's purpose and mood.
        4.  If a font is "Not Ideal", provide a single, better font 'recommendation' and a very brief 'reason' (under 10 words).

        Respond ONLY with a valid JSON object based on the following structure. Do not include markdown formatting like ```json.

        {{
          "purpose": "A short descriptive purpose",
          "mood": "A single word for the mood",
          "fontEvaluations": [
            {{
              "fontName": "Name of Used Font",
              "evaluation": "Good",
              "recommendation": null,
              "reason": null
            }},
            {{
              "fontName": "Name of another Used Font",
              "evaluation": "Not Ideal",
              "recommendation": "Suggested Font Name",
              "reason": "Brief reason for suggestion."
            }}
          ]
        }}
    """

    try:
        # Use the model's feature to directly request a JSON response
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        # The response text should be a clean JSON string
        result = json.loads(response.text)
        
        return jsonify(result)

    except Exception as e:
        # Handle potential errors from the API call
        print(f"An error occurred during Google AI API call: {e}")
        return jsonify({"error": "Failed to get a valid response from the AI model."}), 500

# --- Start the Server ---
if __name__ == '__main__':
    # Runs the Flask app on localhost, port 3000
    # debug=True allows the server to auto-reload when you save changes
    app.run(port=3000, debug=True)