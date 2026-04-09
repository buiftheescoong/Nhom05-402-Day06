import json
import logging
from abc import ABC, abstractmethod

import openai
import google.generativeai as genai

from app.config import settings

logger = logging.getLogger(__name__)


class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, system: str = "", temperature: float = 0.3, json_mode: bool = False) -> str:
        ...


class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str):
        self.client = openai.AsyncOpenAI(api_key=api_key)

    async def generate(self, prompt: str, system: str = "", temperature: float = 0.3, json_mode: bool = False) -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        kwargs = {
            "model": "gpt-4o-mini",
            "messages": messages,
            "temperature": temperature,
            "max_tokens": 4096,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        response = await self.client.chat.completions.create(**kwargs)
        return response.choices[0].message.content or ""


class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-1.5-flash")

    async def generate(self, prompt: str, system: str = "", temperature: float = 0.3, json_mode: bool = False) -> str:
        full_prompt = f"{system}\n\n{prompt}" if system else prompt
        if json_mode:
            full_prompt += "\n\nIMPORTANT: Return ONLY valid JSON, no markdown."

        response = await self.model.generate_content_async(
            full_prompt,
            generation_config=genai.GenerationConfig(temperature=temperature, max_output_tokens=4096),
        )
        return response.text or ""


class LLMRouter:
    def __init__(self):
        self.providers: dict[str, LLMProvider] = {}
        if settings.openai_api_key:
            self.providers["openai"] = OpenAIProvider(settings.openai_api_key)
        if settings.gemini_api_key:
            self.providers["gemini"] = GeminiProvider(settings.gemini_api_key)
        self.default = settings.default_llm_provider

    async def generate(
        self,
        prompt: str,
        system: str = "",
        provider: str | None = None,
        temperature: float = 0.3,
        json_mode: bool = False,
    ) -> str:
        target = provider or self.default
        fallback = "gemini" if target == "openai" else "openai"

        for name in [target, fallback]:
            if name not in self.providers:
                continue
            try:
                return await self.providers[name].generate(prompt, system, temperature, json_mode)
            except Exception as e:
                logger.warning("LLM provider %s failed: %s", name, e)

        raise RuntimeError("No LLM provider available")

    async def generate_json(
        self,
        prompt: str,
        system: str = "",
        provider: str | None = None,
        temperature: float = 0.3,
    ) -> dict | list:
        raw = await self.generate(prompt, system, provider, temperature, json_mode=True)
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0]
        return json.loads(cleaned)


llm_router = LLMRouter()
