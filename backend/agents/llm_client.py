"""
Multi-provider LLM client supporting Anthropic Claude and OpenAI GPT models.
"""

import os
from typing import Literal, Optional
from anthropic import Anthropic
from openai import OpenAI
from google import genai
from google.genai import types as genai_types

ModelProvider = Literal["anthropic", "openai", "google"]

# Model configurations
MODEL_CONFIGS = {
    "claude-3-5-sonnet-20241022": {
        "provider": "anthropic",
        "display_name": "Claude 3.5 Sonnet",
        "max_tokens": 8192,
    },
    "claude-3-opus-20240229": {
        "provider": "anthropic",
        "display_name": "Claude 3 Opus",
        "max_tokens": 4096,
    },
    "gpt-4o": {
        "provider": "openai",
        "display_name": "GPT-4o",
        "max_tokens": 16384,
    },
    "gpt-4-turbo": {
        "provider": "openai",
        "display_name": "GPT-4 Turbo",
        "max_tokens": 4096,
    },
    "gpt-4": {
        "provider": "openai",
        "display_name": "GPT-4",
        "max_tokens": 8192,
    },
    "gemini-2.5-flash": {
        "provider": "google",
        "display_name": "Gemini 2.5 Flash",
        "max_tokens": 8192,
    },
    "gemini-2.0-flash": {
        "provider": "google",
        "display_name": "Gemini 2.0 Flash",
        "max_tokens": 8192,
    },
    "gemini-2.0-flash-lite": {
        "provider": "google",
        "display_name": "Gemini 2.0 Flash Lite",
        "max_tokens": 8192,
    },
}


DEFAULT_MODEL = "gpt-4o"


class LLMClient:
    """Unified interface for multiple LLM providers."""

    def __init__(self, model: str = DEFAULT_MODEL):
        self.model = model
        self.config = MODEL_CONFIGS.get(model, MODEL_CONFIGS[DEFAULT_MODEL])
        self.provider = self.config["provider"]

        if self.provider == "anthropic":
            self.client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        elif self.provider == "openai":
            self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        elif self.provider == "google":
            self.client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")

    def create_message(self, system: str, user_message: str, max_tokens: Optional[int] = None) -> str:
        """Create a completion and return the text response."""
        max_tokens = max_tokens or self.config["max_tokens"]

        if self.provider == "anthropic":
            response = self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                system=system,
                messages=[{"role": "user", "content": user_message}],
            )
            return response.content[0].text

        elif self.provider == "openai":
            response = self.client.chat.completions.create(
                model=self.model,
                max_tokens=max_tokens,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_message},
                ],
            )
            return response.choices[0].message.content or ""

        elif self.provider == "google":
            response = self.client.models.generate_content(
                model=self.model,
                contents=user_message,
                config=genai_types.GenerateContentConfig(
                    system_instruction=system,
                    max_output_tokens=max_tokens,
                ),
            )
            return response.text

        raise ValueError(f"Unsupported provider: {self.provider}")


def get_available_models() -> list[dict]:
    """Return list of available models with their metadata."""
    return [
        {"id": model_id, **config}
        for model_id, config in MODEL_CONFIGS.items()
    ]
