import json
import logging
import re
from abc import ABC, abstractmethod

import openai
import google.generativeai as genai

from app.config import settings

logger = logging.getLogger(__name__)


class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, system: str = "", temperature: float = 0.3, json_mode: bool = False) -> str:
        ...

    @abstractmethod
    async def generate_stream(self, prompt: str, system: str = "", temperature: float = 0.3):
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

    async def generate_stream(self, prompt: str, system: str = "", temperature: float = 0.3):
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=temperature,
            max_tokens=4096,
            stream=True
        )
        async for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.5-flash")

    async def generate(self, prompt: str, system: str = "", temperature: float = 0.3, json_mode: bool = False) -> str:
        full_prompt = f"{system}\n\n{prompt}" if system else prompt

        if json_mode:
            # Dùng tính năng ràng buộc dữ liệu chuẩn JSON của Google
            config = genai.GenerationConfig(
                temperature=temperature, 
                max_output_tokens=4096,
                response_mime_type="application/json"
            )
        else:
            config = genai.GenerationConfig(temperature=temperature, max_output_tokens=4096)

        response = await self.model.generate_content_async(
            full_prompt,
            generation_config=config,
        )
        return response.text or ""

    async def generate_stream(self, prompt: str, system: str = "", temperature: float = 0.3):
        full_prompt = f"{system}\n\n{prompt}" if system else prompt
        
        response = await self.model.generate_content_async(
            full_prompt,
            generation_config=genai.GenerationConfig(temperature=temperature, max_output_tokens=4096),
            stream=True
        )
        async for chunk in response:
            if chunk.text:
                yield chunk.text


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

    async def generate_stream(
        self,
        prompt: str,
        system: str = "",
        provider: str | None = None,
        temperature: float = 0.3,
    ):
        target = provider or self.default
        if target in self.providers:
            async for chunk in self.providers[target].generate_stream(prompt, system, temperature):
                yield chunk
        else:
            raise RuntimeError(f"LLM provider {target} not available")

    async def generate_json(
        self,
        prompt: str,
        system: str = "",
        provider: str | None = None,
        temperature: float = 0.3,
    ) -> dict | list:
        logger.info("[LLM Router] Bắt đầu gọi API sinh JSON. Độ dài prompt: %d ký tự", len(prompt))
        raw = await self.generate(prompt, system, provider, temperature, json_mode=True)
        raw_stripped = raw.strip()
        
        logger.info("[LLM Router] Độ dài kết quả trả về từ AI: %d ký tự", len(raw_stripped))
        logger.info("[LLM Router] RAW TRẢ VỀ (Đoạn mã đầu): %s ...", raw_stripped[:200].replace('\n', ' '))
        logger.info("[LLM Router] RAW TRẢ VỀ (Đoạn mã cuối): ... %s", raw_stripped[-200:].replace('\n', ' '))

        # Dùng Regex để quét tìm Dấu ngoặc mở/đóng ngoài cùng (Object hoặc Array)
        # Cách này an toàn tuyệt đối 100% so với rsplit
        match = re.search(r'(\{.*\}|\[.*\])', raw_stripped, re.DOTALL)
        if match:
            cleaned = match.group(0)
            logger.info("[LLM Router] Đã bóc tách thành công lõi JSON bằng Regex.")
        else:
            cleaned = raw_stripped
            logger.warning("[LLM Router] Không tìm thấy dấu ngoặc {} hoặc []. Dùng nguyên chuỗi trả về.")

        try:
            return json.loads(cleaned)
        except Exception as e:
            # Thuật toán Auto-Healer (Cứu nạn JSON bị nổ do LLM dừng đột ngột giữa chừng)
            try:
                if cleaned.strip().startswith("["):
                    # Tìm điểm kết thúc của object Đầy Đủ cuối cùng
                    last_brace = cleaned.rfind("}")
                    if last_brace != -1:
                        salvaged_json = cleaned[:last_brace+1] + "]"
                        parsed = json.loads(salvaged_json)
                        logger.warning("[LLM Router] CẢNH BÁO: AI ngưng gen giữa chừng! Auto-Healer đã kích hoạt và vớt được %d phần tử nguyên vẹn.", len(parsed))
                        return parsed
            except Exception:
                pass

            logger.error("[JSON Decode Error] AI sinh ra chuỗi bị vỡ định dạng. Chi tiết lỗi: %s", e)
            logger.error("\n--- NỘI DUNG VỠ (CLEANED) ---\n%s\n------------------------------", cleaned)
            raise


llm_router = LLMRouter()
