#!/usr/bin/env bash
#
# env.sh
#
# Environment configuration and aliases for task management scripts.
# Can be sourced (recommended) into your current shell session or executed directly.
#
# Usage:
#   source ./scripts/env.sh
#   # or:
#   . ./scripts/env.sh
#

# Resolve directory of this script portably across bash and zsh
if [ -n "${BASH_SOURCE[0]}" ]; then
    _SCRIPT_SRC="${BASH_SOURCE[0]}"
elif [ -n "${ZSH_VERSION}" ]; then
    _SCRIPT_SRC="${(%):-%x}"
else
    _SCRIPT_SRC="$0"
fi

SCRIPTS_DIR="$(cd "$(dirname "$_SCRIPT_SRC")" && pwd)"
REPO_ROOT="$(cd "$SCRIPTS_DIR/.." && pwd)"

# Add scripts directory to PATH if not already present
case ":$PATH:" in
    *":$SCRIPTS_DIR:"*) ;;
    *) export PATH="$SCRIPTS_DIR:$PATH" ;;
esac

# Export Repo & Tasks Context
export REPO_ROOT
export TASKS_FILE="$REPO_ROOT/docs/tasks.md"
# Optional document-wide prefix override; unset uses frontmatter, then OT.
# export TASK_ID_PREFIX="OT"

# Define Aliases
alias run-editor='(cd Editor/App && npm run tauri dev -- -- "../../Content/Episodes/Episode 1/Episode.xml")'
alias get-ready-tasks="$SCRIPTS_DIR/get-tasks | sed -E 's/ +\\|$/ |/; s/-{10,}/---/'"
alias get-planning-tasks="$SCRIPTS_DIR/get-tasks --planning | sed -E 's/ +\\|$/ |/; s/-{10,}/---/'"
alias add-task="$SCRIPTS_DIR/add-task"
alias get-task="$SCRIPTS_DIR/get-task"
alias get-tasks="$SCRIPTS_DIR/get-tasks"
alias update-task="$SCRIPTS_DIR/update-task"
alias update-tasks="$SCRIPTS_DIR/update-tasks"
alias triage="$SCRIPTS_DIR/triage"
alias triage-hermes="$SCRIPTS_DIR/triage --hermes"
alias research="$SCRIPTS_DIR/research"
alias research-hermes="$SCRIPTS_DIR/research --hermes"
alias groom="$SCRIPTS_DIR/get-tasks --planning | sed -E 's/ +\\|$/ |/; s/-{10,}/---/'"
alias dp="$SCRIPTS_DIR/get-tasks --planning | sed -E 's/ +\\|$/ |/; s/-{10,}/---/'"
alias work-on-task="$SCRIPTS_DIR/work-on-task"

# Source optional local uncommitted environment settings if present
if [ -f "$SCRIPTS_DIR/env.sh.local" ]; then
    # shellcheck source=/dev/null
    . "$SCRIPTS_DIR/env.sh.local"
elif [ -f "$REPO_ROOT/.env" ]; then
    # shellcheck source=/dev/null
    . "$REPO_ROOT/.env"
fi

# Detect whether this file is being sourced or executed directly
_IS_SOURCED=0
if [ -n "${ZSH_VERSION}" ]; then
    case "$ZSH_EVAL_CONTEXT" in
        *:file*) _IS_SOURCED=1 ;;
    esac
elif [ -n "${BASH_VERSION}" ]; then
    if [ "${BASH_SOURCE[0]}" != "$0" ]; then
        _IS_SOURCED=1
    fi
fi

if [ "$_IS_SOURCED" -eq 1 ]; then
    echo "Task environment initialized. Scripts added to PATH and aliases defined."
else
    echo "Task environment script executed."
    echo "To load aliases and PATH into your current shell session, run:"
    echo "  source $SCRIPTS_DIR/env.sh"
    echo "  # or: . $SCRIPTS_DIR/env.sh"
fi
