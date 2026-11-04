import React, { useEffect, useState } from "react";
import { AppState, Text, View } from "react-native";
import OriginalPreview from "./OriginalPreview";
import { previewFile, deletePreview } from "./vault";
import { s } from "../../design/ui";
export default function SecurePreview({
  bytes,
  mime,
  onLoad,
  onError,
}: {
  bytes: Uint8Array;
  mime: string;
  onLoad: () => void;
  onError: () => void;
}) {
  const [uri, setUri] = useState("");
  useEffect(() => {
    let alive = true,
      url = "";
    void previewFile(bytes, mime)
      .then(async (value) => {
        url = value;
        if (alive) setUri(value);
        else await deletePreview(value);
      })
      .catch(onError);
    const listener = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        setUri("");
        if (url) void deletePreview(url);
        onError();
      }
    });
    return () => {
      alive = false;
      listener.remove();
      if (url) void deletePreview(url);
    };
  }, [bytes, mime]); // eslint-disable-line react-hooks/exhaustive-deps
  return uri ? (
    <View style={s.card}>
      <OriginalPreview
        uri={uri}
        mime={mime}
        onLoad={onLoad}
        onError={onError}
      />
    </View>
  ) : (
    <Text style={s.muted}>…</Text>
  );
}
