import os
from typing import Dict, List, Optional
from .base import BaseAgent
from .antigravity import AntigravityAgent
from .hermes import HermesAgent

_REGISTERED_AGENTS: List[BaseAgent] = [
    AntigravityAgent(),
    HermesAgent(),
]

_LOOKUP_MAP: Dict[str, BaseAgent] = {}
for agent in _REGISTERED_AGENTS:
    _LOOKUP_MAP[agent.name.lower()] = agent
    for alias in agent.aliases:
        _LOOKUP_MAP[alias.lower()] = agent


def list_agents() -> List[BaseAgent]:
    """Return list of all registered agent instances."""
    return list(_REGISTERED_AGENTS)


def get_agent(name_or_alias: str) -> Optional[BaseAgent]:
    """Look up an agent by its primary name or any alias."""
    return _LOOKUP_MAP.get(name_or_alias.strip().lower())


def get_default_agent() -> BaseAgent:
    """
    Resolve the default agent to use:
    1. Check TASK_AGENT environment variable.
    2. Fall back to the first available agent CLI found on PATH.
    3. If none installed, return the first registered agent (which will report not found on launch).
    """
    env_agent = os.environ.get("TASK_AGENT")
    if env_agent:
        matched = get_agent(env_agent)
        if matched:
            return matched
        else:
            raise ValueError(
                f"Unknown agent specified in TASK_AGENT='{env_agent}'. "
                f"Available agents: {', '.join([a.name for a in _REGISTERED_AGENTS])}"
            )

    # Auto-detect available agent
    for agent in _REGISTERED_AGENTS:
        if agent.is_available():
            return agent

    return _REGISTERED_AGENTS[0]
