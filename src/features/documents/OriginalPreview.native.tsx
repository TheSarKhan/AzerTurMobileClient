import React from "react";
import { Image, View } from "react-native";
import Pdf from "react-native-pdf";
export default function OriginalPreview({
  uri,
  mime,
  onLoad,
  onError,
}: {
  uri: string;
  mime: string;
  onLoad: () => void;
  onError: () => void;
}) {
  return (
    <View style={{ height: 560, backgroundColor: "#fff" }}>
      {mime === "application/pdf" ? (
        <Pdf
          source={{ uri, cache: false }}
          trustAllCerts={false}
          onLoadComplete={onLoad}
          onError={onError}
          enableAnnotationRendering={false}
          style={{ flex: 1 }}
        />
      ) : (
        <Image
          source={{ uri }}
          resizeMode="contain"
          onLoad={onLoad}
          onError={onError}
          style={{ flex: 1 }}
        />
      )}
    </View>
  );
}
