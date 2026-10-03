import os
import shutil
from typing import List, Optional
from .base import BaseAgent


class AntigravityAgent(BaseAgent):
    """Adapter for Google Antigravity CLI (agy)."""

    name = "antigravity"
    aliases = ["agy"]

    def is_available(self) -> bool:
        return shutil.which("agy") is not None

    def launch(self, prompt: str, extra_args: Optional[List[str]] = None) -> None:
        bin_path = shutil.which("agy")
        if not bin_path:
            raise FileNotFoundError("Antigravity CLI ('agy') is not found on PATH.")

        cmd = [bin_path, "-i", prompt]
        if extra_args:
            cmd.extend(extra_args)

        os.execvp(bin_path, cmd)
