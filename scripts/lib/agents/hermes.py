import os
import shutil
from typing import List, Optional
from .base import BaseAgent


class HermesAgent(BaseAgent):
    """Adapter for Hermes Agent CLI."""

    name = "hermes"
    aliases = ["hermes-agent"]

    def is_available(self) -> bool:
        return shutil.which("hermes") is not None

    def launch(self, prompt: str, extra_args: Optional[List[str]] = None) -> None:
        bin_path = shutil.which("hermes")
        if not bin_path:
            raise FileNotFoundError("Hermes CLI ('hermes') is not found on PATH.")

        cmd = [bin_path, "chat", "-q", prompt]
        if extra_args:
            cmd.extend(extra_args)

        os.execvp(bin_path, cmd)
