# Population Genetics Coach v0.6.0

## Added
- A real six-question, 40-minute mixed mock examination based on the uploaded QBio305 sample-exam structure.
- Voice dictation beside every AI-evaluated text field and in the AI tutor.
- Read-aloud controls for AI feedback and tutor responses.
- Voice enable/disable, automatic reading, and speech-rate settings.
- Two mathematical-reasoning sections in every lesson, using the lesson's existing approved model and notation.
- Larger global typography and corrected Concept Library confidence controls.
- Manual concept-deck reshuffling.

## Voice architecture
The beta uses browser speech recognition and speech synthesis. Gemini remains responsible for course-grounded reasoning and feedback through Supabase Edge Functions. This gives a natural voice workflow without exposing the Gemini key in the browser.
