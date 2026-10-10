"""Knowledge graph entity and relationship extraction service with Ollama LLM / Rule-based hybrid approach."""
import json
import re
import logging
from typing import List, Dict, Any, Tuple
from app.services.ollama_service import ollama_service

logger = logging.getLogger(__name__)

GRAPH_EXTRACTION_PROMPT = """You are a knowledge graph extractor. Analyze the following excerpt and extract key entities and relationships.
Only extract entities that are clearly defined or mentioned.

Valid entity categories:
- Technology
- Algorithm
- Person
- Organization
- Topic
- Project
- Location
- Concept

Valid relationship types:
- RELATED_TO
- USES
- PART_OF
- DEPENDS_ON
- CONTRADICTS
- MENTIONS

Output ONLY valid JSON with this exact structure:
{
  "entities": [
    {"name": "Entity Name", "category": "Technology", "description": "Brief description"}
  ],
  "relationships": [
    {"source": "Entity Name", "target": "Other Entity", "relation_type": "USES", "description": "Brief justification"}
  ]
}

Excerpt:
\"\"\"{text}\"\"\"
"""


class GraphExtractor:
    @staticmethod
    def rule_based_fallback(text: str) -> Dict[str, Any]:
        """
        Deterministic, fast extraction of capitalized terms, acronyms, and key technical phrases
        when Ollama is offline or under high load.
        """
        entities = []
        relationships = []
        seen = set()

        # Find capitalized multi-word phrases or capitalized keywords
        capitalized_matches = re.findall(r'\b[A-Z][a-zA-Z0-9_\-\.]{2,}(?:\s+[A-Z][a-zA-Z0-9_\-\.]{2,})*\b', text)
        for term in capitalized_matches:
            term = term.strip()
            if len(term) > 3 and term.lower() not in {"the", "this", "that", "with", "from", "they", "have", "been", "were"}:
                if term not in seen:
                    seen.add(term)
                    # Categorize heuristically
                    category = "Topic"
                    if any(w in term.lower() for w in ["ai", "algorithm", "network", "system", "model", "transformer", "bert", "gpt", "rag"]):
                        category = "Technology"
                    elif any(w in term.lower() for w in ["dr.", "prof", "john", "alan", "turing", "smith"]):
                        category = "Person"
                    elif any(w in term.lower() for w in ["google", "ibm", "openai", "microsoft", "university", "meta"]):
                        category = "Organization"
                    entities.append({
                        "name": term,
                        "category": category,
                        "description": f"Extracted from document passage: {term}"
                    })

        # Generate relationships between co-occurring entities in same passage
        ent_names = [e["name"] for e in entities[:8]]
        for i in range(len(ent_names)):
            for j in range(i + 1, min(i + 3, len(ent_names))):
                relationships.append({
                    "source": ent_names[i],
                    "target": ent_names[j],
                    "relation_type": "RELATED_TO",
                    "description": f"Co-occurs in document passage"
                })

        return {"entities": entities[:12], "relationships": relationships[:10]}

    @classmethod
    async def extract_from_chunk(cls, text: str) -> Dict[str, Any]:
        """Attempt LLM extraction first, gracefully fallback to rule-based parser if LLM unreachable."""
        if not text or len(text.strip()) < 40:
            return {"entities": [], "relationships": []}

        # First check if Ollama is accessible
        try:
            health = await ollama_service.check_health()
            if health.get("is_reachable"):
                prompt = GRAPH_EXTRACTION_PROMPT.format(text=text[:1200])
                response = await ollama_service.generate_response(prompt=prompt, temperature=0.1, max_tokens=600)
                # Parse JSON out of response
                json_match = re.search(r'\{.*\}', response, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group(0))
                    if "entities" in parsed and "relationships" in parsed:
                        return parsed
        except Exception as e:
            logger.info(f"Ollama extraction not used, applying rule-based extraction: {e}")

        # Fallback
        return cls.rule_based_fallback(text)
