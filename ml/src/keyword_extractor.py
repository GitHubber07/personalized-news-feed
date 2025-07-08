from flask import Flask, request, jsonify
from keybert import KeyBERT
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS so Node.js can talk to this

kw_model = KeyBERT()

@app.route("/extract_keywords", methods=["POST"])
def extract_keywords():
    data = request.get_json()
    text = data.get("text", "")

    if not text:
        return jsonify({'keywords': []})

    keywords = kw_model.extract_keywords(text, top_n=5)
    keyword_list = [kw[0] for kw in keywords]

    return jsonify({'keywords': keyword_list})


if __name__ == "__main__":
    app.run(port=6000)
