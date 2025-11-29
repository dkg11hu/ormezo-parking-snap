# --- Custom WSL startup prompt ---

# Színes, informatív prompt
PS1='\[\e[32m\]\u@\h\[\e[0m\]:\[\e[34m\]\w\[\e[0m\]\$ '

# Default directory: GitHub workspace
cd ~/GitHub

# Welcome message
echo "🚀 Welcome to WSL, Gábor!"
echo "📂 Current workspace: $(pwd)"

# Quick aliases for projects
alias ormezo-hybrid='cd ~/GitHub/ormezo-parking-hybrid'
alias ormezo-snap='cd ~/GitHub/ormezo-parking-snap'
alias gh='cd ~/GitHub'