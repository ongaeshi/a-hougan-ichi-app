# Critical Technical Rules
- **OS Environment**: Windows
- **Command Execution**: To ensure terminal processes (Node.js, npm, etc.) terminate correctly on Windows, you must prepend `cmd /c` to commands running node or npm scripts.
  - Example: `cmd /c npm install`, `cmd /c npm run dev`, `cmd /c node server.js`.
  - Failure to do this for node/npm processes will cause the process to hang; this is mandatory. Standard executables like `git` do not require this.

# Project Information: Elementary School Admission "Grid Position" Web App

This project is a web application designed to help children enjoyably learn "grid position" problems for elementary school admissions using visual and auditory senses.

## Development Policies & Rules
- **Tech Stack**: React + TypeScript (Vite)
- **Styling**: Use Vanilla CSS / CSS Modules. Do NOT use Tailwind CSS.
- **Design**:
  - Aim for bright, friendly colors suitable for children (e.g., pastel colors and warm gradients).
  - Incorporate micro-interactions upon tapping (e.g., ripple effects or bounce animations) to create a premium, fun-to-touch UI.
- **Audio Features**:
  - Use the Web Speech API (SpeechSynthesis) to automatically read the questions aloud.
  - Dynamically generate sound effects for correct/incorrect answers ("ding-dong" for correct, "buzzer" for incorrect) using the Web Audio API or simple audio files.
- **Basic Specifications**:
  - Display a grid (default is 5x5).
  - Provide audio instructions such as "nth from the top, mth from the right".
  - Tapping the correct square counts as a correct answer, and an incorrect square as incorrect. Display visual feedback (circle for correct, cross for incorrect).
  - Ask 10 questions consecutively, and display the accuracy rate (score) at the end.

## Open Questions
Address the following points depending on future implementation and consultation with the user (developer):
- **Number of Squares**: The default is assumed to be "5x5", but should we include an option (difficulty selection) to start with easier ones like "3x3" or "4x4"?
- **Problem Variations**: Should we include patterns like "nth from the bottom" in the questions? (The basic combination is "top/bottom" and "right/left").
