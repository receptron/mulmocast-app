export const mermaid_presets = [
  {
    name: "flowchart",
    code: `graph TD
    A[Inspiration] --> B{Brainstorm}
    B -->|Yes| C[Sketch]
    B -->|No| D[Research]
    C --> E{Review}
    E -->|Polish| F[Launch]
    E -->|Revise| B`,
  },
  {
    name: "sequence",
    code: `sequenceDiagram
    participant User
    participant App
    participant AI
    User->>App: Open editor
    App->>AI: Request ideas
    AI-->>App: Return draft
    App-->>User: Show masterpiece
    User->>App: Celebrate 🎉`,
  },
  {
    name: "class",
    code: `classDiagram
    class Visionary {
      +igniteIdea()
      +refineStory()
    }
    class Muse {
      +whisper()
      +inspire()
    }
    Visionary <|-- Muse : fuels
    Visionary o-- Project : crafts
    Project : title
    Project : timeline`,
  },
  {
    name: "state",
    code: `stateDiagram-v2
    [*] --> Dreaming
    Dreaming --> Drafting : spark
    Drafting --> Editing : feedback
    Editing --> Premiere : approval
    Premiere --> [*]
    Editing --> Dreaming : reboot`,
  },
  {
    name: "journey",
    code: `journey
    title Hero's Journey
    section Call to Adventure
      Discover idea: 5: Creator
      Rally team: 4: Producer
    section Trials
      Build prototype: 3: Studio
      Iterate magic: 5: Studio
    section Triumph
      Showcase vision: 5: Audience
      Share impact: 4: Creator`,
  },
];
