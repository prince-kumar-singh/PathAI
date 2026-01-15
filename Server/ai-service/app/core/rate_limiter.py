"""
Smart Rate Limiter for Gemini Models
Handles RPM (Requests Per Minute), TPM (Tokens Per Minute), and RPD (Requests Per Day) limits
with automatic model fallback and quota tracking
"""
import time
import logging
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, Optional, Tuple
import asyncio

logger = logging.getLogger(__name__)


class ModelQuota:
    """Quota configuration for a Gemini model"""
    def __init__(self, model_name: str, rpm: int, tpm: int, rpd: int):
        self.model_name = model_name
        self.rpm_limit = rpm
        self.tpm_limit = tpm
        self.rpd_limit = rpd
        
        # Usage tracking
        self.minute_requests = []  # List of timestamps
        self.minute_tokens = []    # List of (timestamp, token_count)
        self.day_requests = []     # List of timestamps
        
    def can_serve(self, estimated_tokens: int = 4000) -> bool:
        """Check if model can serve a request"""
        self._cleanup_old_records()
        
        rpm_ok = len(self.minute_requests) < self.rpm_limit
        tpm_ok = self._current_minute_tokens() + estimated_tokens <= self.tpm_limit
        rpd_ok = len(self.day_requests) < self.rpd_limit
        
        return rpm_ok and tpm_ok and rpd_ok
    
    def record_request(self, tokens_used: int = 0):
        """Record a request with token usage"""
        now = time.time()
        self.minute_requests.append(now)
        self.day_requests.append(now)
        if tokens_used > 0:
            self.minute_tokens.append((now, tokens_used))
    
    def _current_minute_tokens(self) -> int:
        """Get total tokens used in current minute"""
        return sum(tokens for _, tokens in self.minute_tokens)
    
    def _cleanup_old_records(self):
        """Remove records older than their time windows"""
        now = time.time()
        minute_ago = now - 60
        day_ago = now - 86400
        
        # Clean minute records
        self.minute_requests = [t for t in self.minute_requests if t > minute_ago]
        self.minute_tokens = [(t, tok) for t, tok in self.minute_tokens if t > minute_ago]
        
        # Clean day records
        self.day_requests = [t for t in self.day_requests if t > day_ago]
    
    def get_status(self) -> Dict:
        """Get current quota status"""
        self._cleanup_old_records()
        return {
            "model": self.model_name,
            "rpm": f"{len(self.minute_requests)}/{self.rpm_limit}",
            "tpm": f"{self._current_minute_tokens()}/{self.tpm_limit}",
            "rpd": f"{len(self.day_requests)}/{self.rpd_limit}",
            "available": self.can_serve()
        }


class GeminiRateLimiter:
    """Intelligent rate limiter with automatic model selection"""
    
    def __init__(self):
        logger.info("🚦 Initializing Gemini Rate Limiter...")
        
        # Configure models with current quotas (Verified from official docs: ai.google.dev)
        # Using Gemini 2.5 series - Currently available models as of Jan 2026
        self.models = {
            "gemini-2.5-flash": ModelQuota("gemini-2.5-flash", rpm=15, tpm=1000000, rpd=1500),
            "gemini-2.5-pro": ModelQuota("gemini-2.5-pro", rpm=2, tpm=32000, rpd=50),
            "gemini-2.5-flash-lite": ModelQuota("gemini-2.5-flash-lite", rpm=15, tpm=1000000, rpd=1500)
        }
        
        # Priority order: Flash (best price-performance) → Flash-Lite (speed) → Pro (quality)
        self.priority_order = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"]
        
        logger.info("✅ Rate limiter initialized with 3 models")
    
    async def select_model(self, estimated_tokens: int = 4000) -> Optional[str]:
        """
        Select best available model based on quota
        
        Args:
            estimated_tokens: Estimated tokens for the request (default: 4000 for roadmap)
            
        Returns:
            Model name or None if all models exhausted
        """
        for model_name in self.priority_order:
            quota = self.models[model_name]
            if quota.can_serve(estimated_tokens):
                logger.info(f"✅ Selected model: {model_name}")
                return model_name
        
        # All models exhausted - log status and wait
        logger.warning("⚠️  All models at quota limit!")
        self._log_all_status()
        return None
    
    def record_usage(self, model_name: str, tokens_used: int = 0):
        """Record API usage for a model"""
        if model_name in self.models:
            self.models[model_name].record_request(tokens_used)
            logger.debug(f"📊 Recorded {tokens_used} tokens for {model_name}")
    
    def get_all_status(self) -> Dict:
        """Get status of all models"""
        return {
            model_name: quota.get_status()
            for model_name, quota in self.models.items()
        }
    
    def _log_all_status(self):
        """Log current status of all models"""
        logger.info("=" * 60)
        logger.info("📊 GEMINI MODEL QUOTA STATUS")
        logger.info("=" * 60)
        for model_name, quota in self.models.items():
            status = quota.get_status()
            logger.info(f"{model_name}:")
            logger.info(f"  RPM: {status['rpm']}")
            logger.info(f"  TPM: {status['tpm']}")
            logger.info(f"  RPD: {status['rpd']}")
            logger.info(f"  Available: {'✅' if status['available'] else '❌'}")
        logger.info("=" * 60)
    
    async def wait_for_quota(self, max_wait: int = 60):
        """Wait for quota to become available"""
        logger.info(f"⏳ Waiting for quota (max {max_wait}s)...")
        
        for i in range(max_wait):
            await asyncio.sleep(1)
            
            # Check if any model has quota
            for model_name in self.priority_order:
                if self.models[model_name].can_serve():
                    logger.info(f"✅ Quota available on {model_name} after {i+1}s")
                    return model_name
        
        logger.error("❌ Quota wait timeout!")
        return None


# Singleton instance
rate_limiter = GeminiRateLimiter()
