from abc import ABC, abstractmethod
from typing import List, Optional


class BaseAgent(ABC):
    """Abstract base class for AI CLI agents."""

    name: str = ""
    aliases: List[str] = []

    @abstractmethod
    def is_available(self) -> bool:
        """Check if the agent CLI binary is installed and reachable in PATH."""
        pass

    @abstractmethod
    def launch(self, prompt: str, extra_args: Optional[List[str]] = None) -> None:
        """Launch the agent interactively with the pre-seeded prompt."""
        pass

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} name={self.name}>"
