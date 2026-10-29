import { Room, TokenSource } from "livekit-client";

const LIVEKIT_TOKEN_SERVER_ID = "speakable-11gop5";

export async function createVoiceRoom() {
  const tokenSource = TokenSource.sandboxTokenServer(
    LIVEKIT_TOKEN_SERVER_ID,
  );

  const { serverUrl, participantToken } = await tokenSource.fetch({
    roomName: "speakyy-demo",
  });

  const room = new Room();

  await room.connect(serverUrl, participantToken);

  await room.localParticipant.setMicrophoneEnabled(true);

  return room;
}