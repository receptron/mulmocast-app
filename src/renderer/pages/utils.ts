export const insertSpeakers = (data: MulmoScript) => {
  const existsSpeakersOnBeats = data.beats.reduce((speakers, beat) => {
    if (beat.speaker && !speakers.has(beat.speaker)) {
      speakers.add(beat.speaker);
    }
    return speakers;
  }, new Set());
  Object.keys(data?.speechParams?.speakers ?? {}).map((speaker) => {
    existsSpeakersOnBeats.delete(speaker);
  });
  existsSpeakersOnBeats.forEach((speaker) => {
    data.speechParams.speakers[speaker] = {
      displayName: {
        en: speaker,
      },
      voiceId: "shimmer",
    };
  });
};
