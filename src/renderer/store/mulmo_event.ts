import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { MulmoProgressLog } from "../../types";
import type { SessionType, BeatSessionType, SessionProgressEvent } from "mulmocast";

type SessionStateEntry = Record<SessionType, boolean>;
type BeatSessionStateEntry = Record<BeatSessionType, Record<string, boolean>>;
type SessionState = Record<
  string,
  { beat: BeatSessionStateEntry; artifact: SessionStateEntry; beatGenerate: BeatSessionStateEntry }
>;

type AppSessionProgressEvent = { kind: "beatGenerate"; sessionType: "image"; id: string; inSession: boolean };

export const useMulmoEventStore = defineStore("mulmoEvent", () => {
  const mulmoEvent = ref<Record<string, SessionProgressEvent | AppSessionProgressEvent>>({});
  const sessionState = ref<SessionState>({});

  const mulmoLogCallback = (log: MulmoProgressLog<SessionProgressEvent | AppSessionProgressEvent>) => {
    const { projectId, data } = log;
    const { kind, sessionType, inSession } = data;
    mulmoEvent.value[projectId] = data;
    if (!sessionState.value[projectId]) {
      sessionState.value[projectId] = {
        artifact: {
          audio: false,
          image: false,
          video: false,
          multiLingual: false,
          caption: false,
          pdf: false,
          markdown: false,
          html: false,
        },
        beat: {
          audio: {},
          image: {},
          multiLingual: {},
          caption: {},
          movie: {},
          html: {},
          imageReference: {},
          soundEffect: {},
          lipSync: {},
        },
        beatGenerate: {
          audio: {},
          image: {},
          multiLingual: {},
          caption: {},
          movie: {},
          html: {},
          imageReference: {},
          soundEffect: {},
          lipSync: {},
        },
      };
    }

    if (kind === "session") {
      sessionState.value[projectId]["artifact"][sessionType] = inSession;
    }
    if (kind === "beat") {
      sessionState.value[projectId]["beat"][sessionType][data.id] = inSession;
    }
    if (kind === "beatGenerate") {
      sessionState.value[projectId]["beatGenerate"][sessionType][data.id] = inSession;
    }
  };

  const isArtifactGenerating = computed(() => {
    return Object.keys(sessionState.value).reduce((tmp: Record<string, boolean>, projectId) => {
      tmp[projectId] = Object.values(sessionState.value[projectId]["artifact"]).some((state) => state);
      return tmp;
    }, {});
  });

  const isBeatGenerating = computed(() => {
    return Object.entries(sessionState.value).reduce((tmp: Record<string, boolean>, [projectId, project]) => {
      tmp[projectId] = Object.values(project["beat"]).some(
        (sessionState) => Object.values(sessionState).some(Boolean),
        {},
      );
      return tmp;
    }, {});
  });

  const isGenerating = (projectId: string) => {
    return isArtifactGenerating.value[projectId] || isBeatGenerating.value[projectId];
  };

  const generatingProjectCount = computed(() => {
    return Object.keys(sessionState.value).filter((projectId) => {
      return isArtifactGenerating.value[projectId] || isBeatGenerating.value[projectId];
    }).length;
  });

  return {
    mulmoEvent,
    mulmoLogCallback,
    sessionState,
    isArtifactGenerating,
    isBeatGenerating,
    isGenerating,
    generatingProjectCount,
  };
});
